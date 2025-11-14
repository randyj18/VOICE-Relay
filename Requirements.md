Software Requirements Specification (SRS)

Project: VOICE Relay

(VOICE: Voice Operated Interface for Context Engines)

1. Overview & North Star

1.1. North Star

Be the fastest, simplest, and most secure relay for a voice conversation between an agent and a human.

1.2. Core Principles

Simplicity: The app and backend will be minimal, lightweight, and clean. We avoid all feature bloat.

Security: The system MUST be Zero-Knowledge. No unencrypted user data (prompts or answers) will ever touch the server.

Speed: The user experience must be immediate. The path from prompt-to-voice-to-reply must be seamless.

2. Core Architecture: Zero-Knowledge Relay

The system consists of three parts:

The Client App: The React Native app on the user's phone.

The Agent: The script or IDE plugin on the user's machine.

The Relay: A simple, stateless backend API.

We will use the "Ephemeral Key" End-to-End Encryption (E2EE) model.

Client App: Has a permanent public/private key pair, created on first login. The public key is stored on the server, tied to the user's GitHub account.

Agent: When asking a question, the agent generates a new, one-time-use public/private key pair (an "ephemeral key").

2.1. Full Transaction Flow

Agent (Ask):
a.  Authenticates to the Relay using its GitHub token.
b.  Fetches the app's app_pub_key.
c.  Generates a new temp_pub_key / temp_priv_key pair.
d.  Builds the JSON "Work Order" payload (see 3.2).
e.  Encrypts the entire payload with the app_pub_key.
f.  POSTs the encrypted blob to the /agent/ask endpoint.
g.  The agent's "ask" is complete. It is now up to the agent to have its own separate "mailbox" (e.g., an API endpoint) ready to receive the reply.

Relay (Ask):
a.  Receives the encrypted blob.
b.  Stores it and sends a "new message" push notification to the Client App.

Client App (Receive):
a.  Gets the push notification, fetches the blob (from a secure "get message" endpoint, not specified here).
b.  Decrypts the blob with its app_priv_key.
c.  Reads the JSON "Work Order" and initiates the voice or UI flow.

Client App (Reply):
a.  User provides a plain-text answer.
b.  The app reads the reply_instructions from the "Work Order".
c.  It encrypts the answer using the reply_encryption_key.
d.  It POSTs the encrypted answer directly to the destination_url.
e.  The app's job is done. It "fires and forgets."

3. Backend: Relay API Specification

The Relay is a simple API with 2 stateless endpoints for the Agent. (Note: It will also need an endpoint for the app to fetch messages, but the primary agent-facing API is just two calls).

3.1. Agent Endpoints

POST /auth/get-public-key

Auth: Requires GitHub OAuth token.

Response: {"app_public_key": "..."}

POST /agent/ask

Auth: Requires GitHub OAuth token.

Body: {"encrypted_blob": "..."}

Action: Stores the blob, associates it with the user, and sends a push notification. This is the single billable event for a "Transaction".

3.2. "Work Order" JSON Payload (E2EE)

This is the JSON object that is encrypted and sent by the Agent. This is the only thing the app ever receives.

{
  "topic": "Project Phoenix",
  "prompt": "Need context for Q3. The data seems low.",
  
  "reply_instructions": {
    "destination_url": "[https://api.my-agent.com/v1/reply/abc-123](https://api.my-agent.com/v1/reply/abc-123)",
    "http_method": "POST",
    "reply_encryption_key": "---BEGIN EPHEMERAL PUBLIC KEY---...---END---"
  }
}


topic: The string used to group prompts in the UI.

prompt: The text to be read to the user.

reply_instructions: A JSON object telling the app exactly how to send the reply.

destination_url: The exact URL the app will send the reply to.

http_method: The verb to use (e.g., "POST", "PUT").

reply_encryption_key: The one-time ephemeral public key the app must use to encrypt its reply.

4. Client App (React Native) Specification

4.1. Visual UI Mode

The app must be navigable with a standard UI.

Screen 1: Topics (Home)

A simple list of all unique topic strings.

Each item shows the topic name and a badge with the number of unread prompts.

Project Phoenix (3)

Jira Incidents (5)

Screen 2: Prompt Queue

Tapping a Topic shows a list of all prompts for that topic.

Users can tap any prompt to jump to it.

Screen 3: Prompt Detail

The user sees the prompt text.

Buttons: [Play Aloud], [Record Answer], [Type Answer], [Skip].

"Hands-Free" Button: A floating action button (or similar) labeled [Start Hands-Free Mode] will be visible on Screen 1.

4.2. Hands-Free Voice Mode

This is the app's primary function. It operates in one of two flows, based on the user's setting.

Requirement: When this mode is active, the app MUST keep the screen awake (using react-native-keep-awake).

4.2.1. Default Flow ("Auto-Send: Off")

This is the default, safer flow for new users.

APP (TTS): "New prompt from Topic: [Topic Name]. [Prompt Text] ... You can say Retry, Read Back, or give your answer."

APP (STT): (Listens immediately)

USER (Voice): (Provides their answer, e.g., "The Q3 numbers were low...")

APP (TTS): "Got it. You can say Send, Read Back, or Retry."

APP (STT): (Listens immediately)

USER (Voice): (Gives confirmation, e.g., "Send", "Read Back", "Retry")

APP (Action):

If "Send": App reads reply_instructions, encrypts and sends the answer. (Proceed to Step 8)

If "Read Back": APP (TTS): "Your answer was: '[User's Answer]'. You can say Send, Read Back, or Retry." (Loop back to Step 5)

If "Retry": App discards the last answer and repeats Step 1.

APP (TTS): "Sent. Moving to next prompt." (Loops to Step 1 for the next item).

4.2.2. Power-User Flow ("Auto-Send: On")

This flow is faster and requires no confirmation.

APP (TTS): "New prompt from Topic: [Topic Name]. [Prompt Text] ... (Plays 'start' beep)"

APP (STT): (Listens immediately)

USER (Voice): (Provides their answer. e.g., "The Q3 numbers were low...")

APP (Action): (Detects ~2 seconds of silence)

App reads reply_instructions, encrypts and sends the answer.

APP (TTS): "Sent. Moving to next prompt." (Loops to Step 1 for the next item).

<!-- end list -->

Flow Control Commands (for both modes):

If at Step 3 the user says "Skip": The app says "Skipped. Moving to next prompt." and advances.

If at Step 3 the user says "Repeat": The app repeats Step 1.

4.3. App Settings

A simple settings screen will be available, containing:

[Enable Auto-Send]: A simple toggle (default: Off).

[Link to Ko-fi]: A "Support the Developer" link.

[Transaction Usage]: (See 5. Monetization).

5. Monetization & Platform

Platform: React Native (Android first).

Monetization: The app is free to download. The service will be metered.

Free Tier: 100 free Prompts Sent per month (based on the POST /agent/ask call).

Monetization UI: The App Settings screen will show Prompts Used: [X] / 100. When X > 100, the app will display a simple message: "You have exceeded your free tier limit. Please upgrade to a paid plan."

Priority: The implementation of the payment processing is low priority. The metering (counting to 100) is the first step.