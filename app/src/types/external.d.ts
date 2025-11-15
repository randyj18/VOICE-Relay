/**
 * Type declarations for external libraries
 * These are placeholder declarations to suppress TypeScript errors
 */

declare module 'react-native-keep-awake' {
  import * as React from 'react';
  const KeepAwake: React.ComponentType<{}>;
  export default KeepAwake;
}

declare module 'react-native-voice' {
  export const RNVoice: any;
  export default RNVoice;
}

declare module 'react-native-tts' {
  const Tts: any;
  export default Tts;
}

declare module 'node-forge' {
  namespace forge {
    namespace pki {
      const rsa: {
        generateKeyPair(options: any, callback: any): void;
      };
      function privateKeyToPem(key: any): string;
      function publicKeyToPem(key: any): string;
      function privateKeyFromPem(pem: string): any;
      function publicKeyFromPem(pem: string): any;
    }
    namespace cipher {
      function createCipher(algorithm: string, password: string): any;
      function createDecipher(algorithm: string, password: string): any;
    }
    namespace util {
      function encode64(bytes: string): string;
      function decode64(str: string): string;
    }
    namespace random {
      function getBytesSync(count: number): string;
    }
  }
  const forge: any;
  export = forge;
}
