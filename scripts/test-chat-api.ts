import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testChatAPI() {
  try {
    console.log("Testing Chat API...");

    // Test authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session error:", sessionError);
      return;
    }

    if (!session?.access_token) {
      console.error("No access token available");
      return;
    }

    console.log("✅ Authentication successful");

    // Test GET /api/chats
    console.log("\nTesting GET /api/chats...");
    const chatsResponse = await fetch("http://localhost:3000/api/chats", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (chatsResponse.ok) {
      const chatsData = await chatsResponse.json();
      console.log("✅ GET /api/chats successful:", chatsData);
    } else {
      const errorData = await chatsResponse.json();
      console.error("❌ GET /api/chats failed:", errorData);
    }

    // Test POST /api/chats (create a test chat)
    console.log("\nTesting POST /api/chats...");
    const createChatResponse = await fetch("http://localhost:3000/api/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: "direct",
        memberIds: [session.user.id],
      }),
    });

    if (createChatResponse.ok) {
      const chatData = await createChatResponse.json();
      console.log("✅ POST /api/chats successful:", chatData);

      // Test GET /api/chats/[chatId]/messages
      console.log(`\nTesting GET /api/chats/${chatData.id}/messages...`);
      const messagesResponse = await fetch(`http://localhost:3000/api/chats/${chatData.id}/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        console.log("✅ GET /api/chats/[chatId]/messages successful:", messagesData);
      } else {
        const errorData = await messagesResponse.json();
        console.error("❌ GET /api/chats/[chatId]/messages failed:", errorData);
      }

      // Test POST /api/chats/[chatId]/messages
      console.log(`\nTesting POST /api/chats/${chatData.id}/messages...`);
      const sendMessageResponse = await fetch(`http://localhost:3000/api/chats/${chatData.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: "Test message from API",
        }),
      });

      if (sendMessageResponse.ok) {
        const messageData = await sendMessageResponse.json();
        console.log("✅ POST /api/chats/[chatId]/messages successful:", messageData);
      } else {
        const errorData = await sendMessageResponse.json();
        console.error("❌ POST /api/chats/[chatId]/messages failed:", errorData);
      }
    } else {
      const errorData = await createChatResponse.json();
      console.error("❌ POST /api/chats failed:", errorData);
    }

  } catch (error) {
    console.error("Test failed:", error);
  }
}

testChatAPI(); 