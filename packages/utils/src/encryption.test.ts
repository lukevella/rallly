import { decrypt, encrypt } from "./encryption";

describe("encryption", () => {
  const testPassword = "test-password-123";
  const testData = "sensitive data that needs encryption";

  describe("encrypt", () => {
    it("should return a base64 encoded string", () => {
      const encrypted = encrypt(testData, testPassword);

      expect(typeof encrypted).toBe("string");
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });

    it("should produce different outputs for the same input (non-deterministic)", () => {
      const encrypted1 = encrypt(testData, testPassword);
      const encrypted2 = encrypt(testData, testPassword);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty strings", () => {
      const encrypted = encrypt("", testPassword);

      expect(typeof encrypted).toBe("string");
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should handle unicode characters", () => {
      const unicodeData = "🔐 測試 データ ñáéíóú";
      const encrypted = encrypt(unicodeData, testPassword);

      expect(typeof encrypted).toBe("string");
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });

    it("should handle long strings", () => {
      const longData = "a".repeat(10000);
      const encrypted = encrypt(longData, testPassword);

      expect(typeof encrypted).toBe("string");
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
    });
  });

  describe("decrypt", () => {
    it("should correctly decrypt encrypted data", () => {
      const encrypted = encrypt(testData, testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      expect(decrypted).toBe(testData);
    });

    it("should handle empty strings", () => {
      const encrypted = encrypt("", testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      expect(decrypted).toBe("");
    });

    it("should handle unicode characters", () => {
      const unicodeData = "🔐 測試 データ ñáéíóú";
      const encrypted = encrypt(unicodeData, testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      expect(decrypted).toBe(unicodeData);
    });

    it("should handle long strings", () => {
      const longData = "a".repeat(10000);
      const encrypted = encrypt(longData, testPassword);
      const decrypted = decrypt(encrypted, testPassword);

      expect(decrypted).toBe(longData);
    });
  });

  describe("roundtrip encryption/decryption", () => {
    const testCases = [
      { name: "simple text", data: "hello world" },
      { name: "empty string", data: "" },
      { name: "numbers", data: "1234567890" },
      { name: "special characters", data: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
      { name: "unicode", data: "🔐 測試 データ ñáéíóú" },
      { name: "json-like", data: '{"key": "value", "array": [1, 2, 3]}' },
      { name: "multiline", data: "line1\nline2\rline3\r\nline4" },
      { name: "whitespace", data: "   \t\n   " },
    ];

    testCases.forEach(({ name, data }) => {
      it(`should correctly encrypt and decrypt ${name}`, () => {
        const encrypted = encrypt(data, testPassword);
        const decrypted = decrypt(encrypted, testPassword);

        expect(decrypted).toBe(data);
      });
    });
  });

  describe("password validation", () => {
    it("should fail to decrypt with wrong password", () => {
      const encrypted = encrypt(testData, testPassword);

      expect(() => {
        decrypt(encrypted, "wrong-password");
      }).toThrow();
    });

    it("should work with different passwords", () => {
      const password1 = "password1";
      const password2 = "password2";

      const encrypted1 = encrypt(testData, password1);
      const encrypted2 = encrypt(testData, password2);

      expect(decrypt(encrypted1, password1)).toBe(testData);
      expect(decrypt(encrypted2, password2)).toBe(testData);

      // Cross-decryption should fail
      expect(() => decrypt(encrypted1, password2)).toThrow();
      expect(() => decrypt(encrypted2, password1)).toThrow();
    });

    it("should handle empty password", () => {
      const encrypted = encrypt(testData, "");
      const decrypted = decrypt(encrypted, "");

      expect(decrypted).toBe(testData);
    });
  });

  describe("error handling", () => {
    it("should throw error for invalid base64 data", () => {
      expect(() => {
        decrypt("not-valid-base64!", testPassword);
      }).toThrow();
    });

    it("should throw error for truncated data", () => {
      const encrypted = encrypt(testData, testPassword);
      const truncated = encrypted.slice(0, -10); // Remove last 10 characters

      expect(() => {
        decrypt(truncated, testPassword);
      }).toThrow();
    });

    it("should throw error for empty encrypted data", () => {
      expect(() => {
        decrypt("", testPassword);
      }).toThrow();
    });

    it("should throw error for unsupported version", () => {
      // Create a buffer with version 99 (unsupported)
      const buffer = Buffer.alloc(100);
      buffer[0] = 99; // Unsupported version
      const invalidVersionData = buffer.toString("base64");

      expect(() => {
        decrypt(invalidVersionData, testPassword);
      }).toThrow("Unsupported encryption version: 99");
    });

    it("should throw error for data too short to contain all components", () => {
      // Create data that's too short (less than version + salt + iv + authTag)
      const shortBuffer = Buffer.alloc(10);
      shortBuffer[0] = 1; // Valid version but data too short
      const shortData = shortBuffer.toString("base64");

      expect(() => {
        decrypt(shortData, testPassword);
      }).toThrow();
    });
  });

  describe("security properties", () => {
    it("should produce different salts for each encryption", () => {
      const encrypted1 = encrypt(testData, testPassword);
      const encrypted2 = encrypt(testData, testPassword);

      const buffer1 = Buffer.from(encrypted1, "base64");
      const buffer2 = Buffer.from(encrypted2, "base64");

      // Extract salt (bytes 1-32, after version byte)
      const salt1 = buffer1.subarray(1, 33);
      const salt2 = buffer2.subarray(1, 33);

      expect(salt1.equals(salt2)).toBe(false);
    });

    it("should produce different IVs for each encryption", () => {
      const encrypted1 = encrypt(testData, testPassword);
      const encrypted2 = encrypt(testData, testPassword);

      const buffer1 = Buffer.from(encrypted1, "base64");
      const buffer2 = Buffer.from(encrypted2, "base64");

      // Extract IV (bytes 33-45, after version + salt)
      const iv1 = buffer1.subarray(33, 45);
      const iv2 = buffer2.subarray(33, 45);

      expect(iv1.equals(iv2)).toBe(false);
    });

    it("should include version information", () => {
      const encrypted = encrypt(testData, testPassword);
      const buffer = Buffer.from(encrypted, "base64");

      // First byte should be version 1
      expect(buffer[0]).toBe(1);
    });

    it("should handle very long passwords", () => {
      const longPassword = "a".repeat(1000);
      const encrypted = encrypt(testData, longPassword);
      const decrypted = decrypt(encrypted, longPassword);

      expect(decrypted).toBe(testData);
    });

    it("should handle passwords with unicode characters", () => {
      const unicodePassword = "🔑 パスワード señora ñúñez";
      const encrypted = encrypt(testData, unicodePassword);
      const decrypted = decrypt(encrypted, unicodePassword);

      expect(decrypted).toBe(testData);
    });
  });

  describe("data integrity", () => {
    it("should detect tampering with encrypted data", () => {
      const encrypted = encrypt(testData, testPassword);
      const buffer = Buffer.from(encrypted, "base64");
      // Tamper with the last byte (encrypted data)
      const lastIndex = buffer.length - 1;
      if (lastIndex >= 0 && buffer[lastIndex] !== undefined) {
        buffer[lastIndex] ^= 1;
      }
      const tamperedData = buffer.toString("base64");

      expect(() => {
        decrypt(tamperedData, testPassword);
      }).toThrow();
    });

    it("should detect tampering with auth tag", () => {
      const encrypted = encrypt(testData, testPassword);
      const buffer = Buffer.from(encrypted, "base64");

      // Tamper with auth tag (bytes 45-61, after version + salt + iv)
      if (buffer.length > 50 && buffer[50] !== undefined) {
        buffer[50] ^= 1;
      }
      const tamperedData = buffer.toString("base64");

      expect(() => {
        decrypt(tamperedData, testPassword);
      }).toThrow();
    });

    it("should detect tampering with IV", () => {
      const encrypted = encrypt(testData, testPassword);
      const buffer = Buffer.from(encrypted, "base64");

      // Tamper with IV (bytes 33-45, after version + salt)
      if (buffer.length > 40 && buffer[40] !== undefined) {
        buffer[40] ^= 1;
      }
      const tamperedData = buffer.toString("base64");

      expect(() => {
        decrypt(tamperedData, testPassword);
      }).toThrow();
    });

    it("should detect tampering with salt", () => {
      const encrypted = encrypt(testData, testPassword);
      const buffer = Buffer.from(encrypted, "base64");

      // Tamper with salt (bytes 1-33, after version)
      if (buffer.length > 10 && buffer[10] !== undefined) {
        buffer[10] ^= 1;
      }
      const tamperedData = buffer.toString("base64");

      expect(() => {
        decrypt(tamperedData, testPassword);
      }).toThrow();
    });
  });
});
