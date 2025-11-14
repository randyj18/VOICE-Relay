AI AGENT CONSTITUTION (claude.md)

Your primary directive is to build the "VOICE Relay" application. You must follow the principles in this document at all times. "VOICE" stands for: Voice Operated Interface for Context Engines.

1. The North Star: Simplicity & Speed

Your North Star is: "Be the fastest, simplest, and most secure relay for a voice conversation."

This is not a feature-heavy application. It is a nimble, lightweight, and clean utility.

Before committing any code, you MUST ask yourself:

"Does this feature add complexity, or does it directly serve the North Star?"

"Is this the simplest possible way to implement this requirement?"

"Am I adding bloat?"

AVOID BLOAT AT ALL COSTS. Do not add:

Unnecessary documentation (e.g., placeholder "todo" docs).

Temporary test files that aren't part of the core test suite.

Complex UI animations, themes, or settings that are not explicitly asked for.

Dependencies on libraries that are not absolutely essential.

2. Development & Commit Workflow

You will build this app by getting from zero to a functional prototype as fast as possible.

Commit Frequency: You MUST commit your changes after every single logical step or code update. Do not batch large changes.

Commit Messages: Your commit messages MUST be detailed. They must explain what you changed and why you changed it in the context of the requirements.

Pre-Commit Hooks: Before every commit, you MUST run a "North Star Check."

Run: git hook --pre-commit check_north_star

Function: This hook will be a simple script you create. It will pause the commit and require you to confirm that your changes are 100% aligned with the "Simplicity & Speed" North Star and do not add bloat.

3. Platform & Tech Stack

Android First: We are targeting Android for the initial release, but the app MUST be built with iOS in mind from day one.

Tech Stack: You will use React Native. This is non-negotiable. It allows us to maintain a single, simple codebase for both platforms.

Libraries: You will use react-native-voice for Speech-to-Text (STT) and react-native-tts for Text-to-Speech (TTS). You will use react-native-keep-awake to keep the screen on during Voice Mode.

4. Path to Production

Your goal is to get to a production-ready app as fast as possible.

Phase 0 (Spike): Prove E2EE compatibility. Build one Python script and one React Native app that can encrypt and decrypt a "hello world" message to each other.

Phase 1: Relay & Security: First, build the "Zero-Knowledge Cloud Relay" backend. This is just two simple, stateless API endpoints.

Phase 2: Core App: Second, build the React Native app. Focus only on the core function: authenticating, receiving an encrypted prompt, decrypting it, and displaying it as text.

Phase 3: Voice Loop: Third, integrate the TTS/STT libraries to create the "Hands-Free Voice Mode." This is the core UX.

Phase 4: UI Polish: Fourth, build the "Visual UI Mode" (Topics/Queues).

Phase 5: Monetization: Monetization (the 100-prompt limit) is the last step. Do not build this until the core app is 100% functional and stable.

Stick to this plan. Do not deviate.