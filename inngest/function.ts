import {
  generateNotes,
  GenerateStudyTypeContent as GenerateStudyTypeAI,
  GenerateQuizAiModel,
  GenerateQuestionAiModel,
  GenerateVideoScript,
} from "@/config/AiModel";
import { inngest } from "./client";
import { db } from "@/config/db";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_MATERIAL_TABLE,
  USER_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  VIDEO_CONTENT_TABLE,
} from "@/config/schema";
import { translateText } from "@/lib/translation/lingoService";
import { generateNarration } from "@/lib/audio/ttsService";
import { and, eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const CreateNewUser = inngest.createFunction(
  {
    id: "create-new-user",
  },
  {
    event: "create-new-user",
  },
  async ({ event, step }) => {
    // Extract user data from event payload
    const { user } = event.data;
    const result = await step.run("Check User and create New", async () => {
      // Check if User Already Exists
      const existingUser = await db
        .select()
        .from(USER_TABLE)
        .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

      if (existingUser.length === 0) {
        // Insert new user into the database
        const newUser = await db
          .insert(USER_TABLE)
          .values({
            name: user?.fullName,
            email: user?.primaryEmailAddress?.emailAddress,
            createdAt: new Date(),
          })
          .returning();

        return `User ${newUser[0].email} created successfully.`;
      } else {
        return `User with email ${user?.primaryEmailAddress?.emailAddress} already exists.`;
      }
    });
  }
);

export const GenerateNotes = inngest.createFunction(
  {
    id: "generate-course",
  },
  {
    event: "notes.generate",
  },
  async ({ event, step }) => {
    const { course } = event.data;
    const notesResult = await step.run("Generate Notes", async () => {
      // Parse courseLayout if it's a string
      let courseLayout = course?.courseLayout;
      if (typeof courseLayout === 'string') {
        try {
          courseLayout = JSON.parse(courseLayout);
        } catch (e) {
          console.error('Error parsing courseLayout:', e);
          return "Failed to parse course layout";
        }
      }

      const Chapters = courseLayout?.chapters;
      
      if (!Chapters || !Array.isArray(Chapters) || Chapters.length === 0) {
        console.error('No chapters found in course layout');
        return "No chapters found";
      }

      // Use for...of loop to properly await async operations
      const failedChapters: number[] = [];
      
      for (let index = 0; index < Chapters.length; index++) {
        const chapter = Chapters[index];
        let success = false;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (!success && retryCount <= maxRetries) {
          try {
            if (retryCount > 0) {
              console.log(`Retrying chapter ${index + 1} (attempt ${retryCount + 1}/${maxRetries + 1})...`);
            }
            
            const PROMPT = `Generate comprehensive study notes for the following chapter:

Chapter Information:
- Chapter Number: ${chapter.chapter_number || index + 1}
- Chapter Title: ${chapter.chapter_title || 'Untitled Chapter'}
- Chapter Summary: ${chapter.chapter_summary || 'No summary provided'}
- Topics to Cover: ${chapter.topics ? chapter.topics.join(', ') : 'All chapter topics'}

Course Context:
- Course Topic: ${course.topic || 'General'}
- Course Type: ${course.courseType || 'General'}
- Difficulty Level: ${course.difficultyLevel || 'Intermediate'}

Instructions:
1. Create detailed, comprehensive study notes covering ALL topics listed above
2. Structure the content with proper HTML headings (h1 for chapter title, h2 for main topics, h3 for subtopics)
3. Include explanations, examples, key concepts, and important points for each topic
4. Use proper HTML formatting: paragraphs, lists, code blocks (if applicable), emphasis tags
5. Make the content exam-focused and educational
6. Ensure all content is well-organized and easy to read
7. Cover every topic point mentioned in the chapter information

Generate the notes now:`;

            const result = await generateNotes.sendMessage(PROMPT);
            const aiResp = await result.response.text();
            
            // Parse JSON and extract HTML content
            let notesContent = aiResp;
            try {
              // Clean JSON string (remove markdown code blocks if present)
              let cleanedText = aiResp.trim();
              if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
              } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/```\n?/g, '');
              }
              
              const parsed = JSON.parse(cleanedText);
              
              // Handle different response formats
              if (parsed.notes?.html_content) {
                notesContent = JSON.stringify({ notes: { html_content: parsed.notes.html_content } });
              } else if (parsed.html_content) {
                notesContent = JSON.stringify({ notes: { html_content: parsed.html_content } });
              } else if (Array.isArray(parsed) && parsed[0]?.notes?.html_content) {
                notesContent = JSON.stringify({ notes: { html_content: parsed[0].notes.html_content } });
              } else {
                // If structure is unexpected, wrap the content
                const contentStr = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
                notesContent = JSON.stringify({ notes: { html_content: contentStr } });
              }
            } catch (e) {
              console.log('Note content is not JSON, wrapping as-is:', e);
              // If parsing fails, wrap the raw response
              notesContent = JSON.stringify({ notes: { html_content: aiResp } });
            }
            
            await db
              .insert(CHAPTER_NOTES_TABLE)
              .values({
                courseId: course.courseId,
                chapterId: chapter.chapter_number !== undefined ? chapter.chapter_number - 1 : index,
                notes: notesContent,
              })
              .returning();
            
            console.log(`✓ Generated notes for chapter ${index + 1}/${Chapters.length}: ${chapter.chapter_title || `Chapter ${index + 1}`}`);
            success = true;
          } catch (error) {
            retryCount++;
            const isTimeout = error instanceof Error && error.message.includes('timeout');
            
            if (retryCount > maxRetries) {
              console.error(`✗ Failed to generate notes for chapter ${index + 1} after ${maxRetries + 1} attempts:`, error);
              failedChapters.push(index + 1);
              
              // Save a placeholder note so the chapter doesn't appear missing
              try {
                await db
                  .insert(CHAPTER_NOTES_TABLE)
                  .values({
                    courseId: course.courseId,
                    chapterId: chapter.chapter_number !== undefined ? chapter.chapter_number - 1 : index,
                    notes: JSON.stringify({ 
                      notes: { 
                        html_content: `<h1>${chapter.chapter_title || `Chapter ${index + 1}`}</h1><p>Notes generation failed. Please try regenerating this chapter later.</p>` 
                      } 
                    }),
                  })
                  .returning();
              } catch (dbError) {
                console.error(`Failed to save placeholder note for chapter ${index + 1}:`, dbError);
              }
            } else if (isTimeout) {
              console.warn(`⚠ Timeout generating notes for chapter ${index + 1}, will retry...`);
            } else {
              console.error(`Error generating notes for chapter ${index + 1} (attempt ${retryCount}):`, error);
            }
          }
        }
      }
      
      if (failedChapters.length > 0) {
        console.warn(`⚠ Failed to generate notes for ${failedChapters.length} chapter(s): ${failedChapters.join(', ')}`);
        return `Notes Generated for ${Chapters.length - failedChapters.length}/${Chapters.length} chapters. Failed chapters: ${failedChapters.join(', ')}`;
      }

      return `Notes Generated Successfully for ${Chapters.length} chapters`;
    });
    const UpdateCourseStatus = await step.run(
      "Update Course Status",
      async () => {
        const result = await db
          .update(STUDY_MATERIAL_TABLE)
          .set({
            status: "notes_generated",
          })
          .where(eq(STUDY_MATERIAL_TABLE.id, course.id))
          .returning();
        return "Course Updated Successfully";
      }
    );
  }
);

export const GenerateStudyTypeContent = inngest.createFunction(
  {
    id: "generate-study-type-content",
  },
  {
    event: "studyType.content",
  },
  async ({ event, step }) => {
    const { studyType, prompt, courseId, recordId } = event.data;

    const AiResult = await step.run(
      "Generating FlashCard using AI",
      async () => {
        let result;

        if (!prompt || typeof prompt !== "string") {
          throw new Error("Invalid prompt: Prompt must be a non-empty string");
        }

        if (studyType === "flashcards") {
          result = await GenerateStudyTypeAI.sendMessage(prompt);
        } else if (studyType === "qa") {
          result = await GenerateQuestionAiModel.sendMessage(prompt);
        } else {
          result = await GenerateQuizAiModel.sendMessage(prompt);
        }
        const text = await result.response.text();
        // Clean JSON string (remove markdown code blocks if present)
        let cleanedText = text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }
        const AIResult = JSON.parse(cleanedText);
        return AIResult;
      }
    );

    const DbResult = await step.run("Save result to DB", async () => {
      const result = await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({
          content: AiResult,
          status: "Ready",
        })
        .where(and(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId)));
      return "Data Saved Successfully";
    });
  }
);

export const GenerateVideoContent = inngest.createFunction(
  {
    id: 'generate-video-content',
    retries: 2,
  },
  {
    event: 'video.generate',
  },
  async ({ event, step }) => {
    const { videoId, courseId, chapterId, language } = event.data;
    
    // Update status
    await step.run('Update Status', async () => {
      await db.update(VIDEO_CONTENT_TABLE)
        .set({ status: 'Generating' })
        .where(eq(VIDEO_CONTENT_TABLE.id, videoId));
    });
    
    // Step 1: Get chapter content
    const chapterContent = await step.run('Fetch Chapter Content', async () => {
      const notes = await db
        .select()
        .from(CHAPTER_NOTES_TABLE)
        .where(
          and(
            eq(CHAPTER_NOTES_TABLE.courseId, courseId),
            eq(CHAPTER_NOTES_TABLE.chapterId, chapterId)
          )
        );
      return notes[0]?.notes || '';
    });
    
    // Step 2: Generate video script
    const script = await step.run('Generate Video Script', async () => {
      const PROMPT = `Generate a 2-minute educational video script for: ${chapterContent}. 
        Include title, concept explanations, code examples if applicable. Return JSON format.`;
      
      const response = await GenerateVideoScript.sendMessage(PROMPT);
      const text = await response.response.text();
      // Clean JSON string (remove markdown code blocks if present)
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      return JSON.parse(cleanedText);
    });
    
    // Step 3: Translate if needed
    const translatedScript = await step.run('Translate Script', async () => {
      if (language === 'en') return script;
      
      const translated = {
        ...script,
        narration: await translateText(script.narration, language, 'narration'),
        scenes: await Promise.all(
          script.scenes.map(async (scene: any) => ({
            ...scene,
            title: await translateText(scene.title, language, 'script'),
            content: scene.content ? await translateText(scene.content, language, 'script') : undefined,
            points: scene.points ? await Promise.all(
              scene.points.map((p: string) => translateText(p, language, 'script'))
            ) : undefined,
          }))
        ),
      };
      return translated;
    });
    
    // Step 4: Generate audio narration
    const audioPath = await step.run('Generate Audio', async () => {
      const outputPath = path.join(process.cwd(), 'tmp', `audio_${videoId}_${language}.mp3`);
      return await generateNarration(
        translatedScript.narration,
        language,
        outputPath
      );
    });
    
    // Step 5: Trigger video rendering via API (separate from Inngest to avoid Remotion bundler issues)
    const videoUrl = await step.run('Render Video', async () => {
      // Call internal API route to render video (this avoids importing Remotion in Inngest)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      try {
        const renderResponse = await fetch(`${baseUrl}/api/video/render`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: translatedScript,
            language,
            audioPath,
            videoId,
          }),
        });
        
        if (!renderResponse.ok) {
          throw new Error(`Video rendering failed: ${renderResponse.statusText}`);
        }
        
        const renderData = await renderResponse.json();
        return renderData.videoUrl || `/tmp/video_${videoId}_${language}.mp4`;
      } catch (error) {
        console.error('Error rendering video:', error);
        // Return placeholder URL - video can be rendered later
        return `/tmp/video_${videoId}_${language}.mp4`;
      }
    });
    
    // Step 7: Update database
    await step.run('Save Video Metadata', async () => {
      await db.update(VIDEO_CONTENT_TABLE)
        .set({
          videoUrl,
          status: 'Ready',
          duration: translatedScript.duration,
          script: translatedScript,
          updatedAt: new Date(),
        })
        .where(eq(VIDEO_CONTENT_TABLE.id, videoId));
    });
    
    return { videoUrl, status: 'Ready' };
  }
);
