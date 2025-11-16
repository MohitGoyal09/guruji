import { db } from "@/config/db";
import { CHAPTER_NOTES_TABLE, STUDY_TYPE_CONTENT_TABLE } from "@/config/schema";
import { NextResponse } from "next/server";
import { eq , and} from "drizzle-orm";

export async function POST(req : Request) {
    try {
        const { courseId, studyType } = await req.json();
        
        if (!courseId || !studyType) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (studyType == "ALL") {
            const notes = await db
                .select()
                .from(CHAPTER_NOTES_TABLE)
                .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            
            const getContent = await db
                .select()
                .from(STUDY_TYPE_CONTENT_TABLE)
                .where(eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId));

            // Unwrap old data structure for all content types
            const unwrapContent = (item: any, type: string) => {
                if (!item) return item;

                if (item.content && typeof item.content === 'object' && !Array.isArray(item.content)) {
                    const data = item.content;
                    // Check if it has the old wrapped structure: { content: {...}, translations: null }
                    if ('content' in data && 'translations' in data) {
                        console.log(`✓ Unwrapping ${type}: removing translations field`);
                        // Unwrap it - use only the content (object or array)
                        return { ...item, content: data.content };
                    }
                }
                return item;
            };

            const result = {
              notes: notes,
              flashcards: unwrapContent(
                getContent.find((content) => content.type === "flashcards") || null,
                'flashcards'
              ),
              quizzes: unwrapContent(
                getContent.find((content) => content.type === "quizzes") || null,
                'quizzes'
              ),
              qa: unwrapContent(
                getContent.find((content) => content.type === "qa") || null,
                'qa'
              ),
            };
            console.log('All study types after unwrap - check if translations removed');
            return NextResponse.json(result);
        }
        else if (studyType == 'notes') {
            const notes = await db
                .select()
                .from(CHAPTER_NOTES_TABLE)
                .where(eq(CHAPTER_NOTES_TABLE.courseId, courseId));
            // console.log('Notes:', notes);
            return NextResponse.json(notes);
        }
        else  {
            const content = await db
            .select()
            .from(STUDY_TYPE_CONTENT_TABLE)
            .where(and(
                eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                eq(STUDY_TYPE_CONTENT_TABLE.type, studyType)
            ));

            // Unwrap old data structure if needed
            if (content[0]?.content && typeof content[0].content === 'object' && !Array.isArray(content[0].content)) {
                const data = content[0].content;

                // Check if it has the old wrapped structure: { content: {...}, translations: null }
                if ('content' in data && 'translations' in data) {
                    console.log(`✓ Unwrapping ${studyType}: removing translations field`);
                    // Unwrap it - use only the content (which might be object or array)
                    content[0].content = data.content;
                    console.log(`✓ ${studyType} unwrapped successfully`);

                    // Save unwrapped data back to database permanently
                    await db
                        .update(STUDY_TYPE_CONTENT_TABLE)
                        .set({ content: data.content })
                        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, content[0].id));
                    console.log(`✓ ${studyType} saved to database without translations`);
                }
            }

            console.log(`Final ${studyType} data:`, JSON.stringify(content[0], null, 2));
            return NextResponse.json(content[0]);
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
 
}