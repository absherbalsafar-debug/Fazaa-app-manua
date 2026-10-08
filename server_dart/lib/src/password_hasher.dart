import 'dart:convert';

import 'package:hashlib/hashlib.dart';

/// Verifies the existing Node.js `salt:scrypt(password, salt, 64)` format.
/// Node uses N=16384, r=8 and p=1 by default; the salt is the UTF-8 bytes of
/// the 32-character hex salt string (not the decoded 16-byte salt).
abstract final class PasswordHasher {
  static const int _cost = 16384;
  static const int _blockSize = 8;
  static const int _parallelism = 1;
  static const int _derivedKeyLength = 64;
  static final String dummyHash =
      '00112233445566778899aabbccddeeff:${List<String>.filled(128, '0').join()}';

  static bool verify(String password, String? stored) {
    if (stored == null) return false;
    final separator = stored.indexOf(':');
    if (separator != 32 || stored.indexOf(':', separator + 1) != -1) {
      return false;
    }
    final salt = stored.substring(0, separator);
    final expected = stored.substring(separator + 1).toLowerCase();
    if (!RegExp(r'^[0-9a-f]{32}$').hasMatch(salt) ||
        !RegExp(r'^[0-9a-f]{128}$').hasMatch(expected)) {
      return false;
    }

    final candidate = Scrypt(
      salt: utf8.encode(salt),
      cost: _cost,
      blockSize: _blockSize,
      parallelism: _parallelism,
      derivedKeyLength: _derivedKeyLength,
    ).convert(utf8.encode(password)).hex();

    return _constantTimeEquals(candidate, expected);
  }

  static bool _constantTimeEquals(String left, String right) {
    if (left.length != right.length) return false;
    var difference = 0;
    for (var index = 0; index < left.length; index++) {
      difference |= left.codeUnitAt(index) ^ right.codeUnitAt(index);
    }
    return difference == 0;
  }
}
