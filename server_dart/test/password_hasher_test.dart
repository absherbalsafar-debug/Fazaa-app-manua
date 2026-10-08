import 'package:fazaah_api_dart/src/password_hasher.dart';
import 'package:test/test.dart';

void main() {
  const stored =
      '00112233445566778899aabbccddeeff:'
      '2897778d6cf59390c66926cd514f3357f1a987c3ccd6d6c25501ee5524731e20'
      '7353bafbc569ac23a4069281ca2aeb2bd90d16de4fbe48eb6a15a2ea25e91a5d';

  test('يتحقق من passwordHash منشأ بخوارزمية Node scrypt الافتراضية', () {
    expect(PasswordHasher.verify('test-password-fazaa', stored), isTrue);
  });

  test('يرفض كلمة مرور غير صحيحة وبنية hash مشوهة', () {
    expect(PasswordHasher.verify('wrong-password', stored), isFalse);
    expect(PasswordHasher.verify('test-password-fazaa', 'broken'), isFalse);
    expect(PasswordHasher.verify('anything', null), isFalse);
  });
}
