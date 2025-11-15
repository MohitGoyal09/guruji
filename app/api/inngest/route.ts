import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  helloWorld,
  CreateNewUser,
  GenerateNotes,
  GenerateStudyTypeContent,
  GenerateVideoContent,
} from "@/inngest/function";
import { NextRequest, NextResponse } from "next/server";

const inngestHandlers = serve({
  client: inngest,
  functions: [
    helloWorld,
    CreateNewUser,
    GenerateNotes,
    GenerateStudyTypeContent,
    GenerateVideoContent,
  ],
});

export const GET = inngestHandlers.GET;
export const POST = inngestHandlers.POST;

// Custom PUT handler to handle empty bodies gracefully
export async function PUT(req: NextRequest, context: any) {
  try {
    // Check content-length header to see if body exists
    const contentLength = req.headers.get("content-length");
    const contentType = req.headers.get("content-type");
    
    // If no content-length or it's 0, or no content-type, body is likely empty
    if (!contentLength || contentLength === "0" || !contentType?.includes("application/json")) {
      // Create a new request with empty JSON body for Inngest's request signing
      const emptyBodyRequest = new Request(req.url, {
        method: "PUT",
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          "content-type": "application/json",
          "content-length": "2", // "{}" is 2 bytes
        },
        body: JSON.stringify({}),
      });
      
      const nextReq = new NextRequest(emptyBodyRequest);
      return inngestHandlers.PUT(nextReq, context);
    }
    
    // Try to parse body to validate it
    try {
      const clonedReq = req.clone();
      const bodyText = await clonedReq.text();
      
      if (!bodyText || bodyText.trim() === "") {
        // Empty body, use empty JSON
        const emptyBodyRequest = new Request(req.url, {
          method: "PUT",
          headers: {
            ...Object.fromEntries(req.headers.entries()),
            "content-type": "application/json",
            "content-length": "2",
          },
          body: JSON.stringify({}),
        });
        
        const nextReq = new NextRequest(emptyBodyRequest);
        return inngestHandlers.PUT(nextReq, context);
      }
      
      // Validate JSON
      JSON.parse(bodyText);
    } catch (parseError) {
      // Invalid or empty body, use empty JSON
      const emptyBodyRequest = new Request(req.url, {
        method: "PUT",
        headers: {
          ...Object.fromEntries(req.headers.entries()),
          "content-type": "application/json",
          "content-length": "2",
        },
        body: JSON.stringify({}),
      });
      
      const nextReq = new NextRequest(emptyBodyRequest);
      return inngestHandlers.PUT(nextReq, context);
    }
    
    // Body is valid, use original request
    return inngestHandlers.PUT(req, context);
  } catch (error: any) {
    // If error is related to JSON parsing in Inngest's request signing, return success
    if (error?.message?.includes("JSON") || error?.message?.includes("body")) {
      console.warn("Inngest PUT request with empty/invalid body, returning success:", error.message);
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    console.error("Error in PUT handler:", error);
    // Re-throw other errors
    throw error;
  }
}
