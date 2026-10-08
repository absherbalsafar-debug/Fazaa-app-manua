import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/app_routes.dart';
import '../../../app/theme/fazaah_theme.dart';
import '../../../core/network/fazaa_backend.dart';
import '../domain/account_role.dart';

enum _LoginMethod { phone, email }

class LoginPage extends StatefulWidget {
  const LoginPage({required this.role, required this.backend, super.key});

  final AccountRole role;
  final FazaaBackend backend;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  _LoginMethod _method = _LoginMethod.phone;
  bool _showPassword = false;
  bool _otpStep = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  String? _developmentOtpCode;

  bool get _isCustomer => widget.role == AccountRole.customer;

  String get _roleTitle => _isCustomer ? 'العميل' : 'المهني';

  String get _apiRole => _isCustomer ? 'client' : 'provider';

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _showNotConnectedMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _openDashboard() {
    Navigator.of(context).pushReplacementNamed(
      _isCustomer ? AppRoutes.customerDashboard : AppRoutes.providerDashboard,
    );
  }

  Future<void> _continueWithPhone() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      final challenge = await widget.backend.sendPhoneOtp(
        phone: _phoneController.text.trim(),
        role: _apiRole,
      );
      if (!mounted) return;
      setState(() {
        _otpStep = true;
        _developmentOtpCode = challenge.developmentCode;
      });
    } on BackendException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'تعذر الاتصال بالخادم. حاول مرة أخرى.');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _submitEmail() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      await widget.backend.loginWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        role: _apiRole,
      );
      if (mounted) _openDashboard();
    } on BackendException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'تعذر الاتصال بالخادم. حاول مرة أخرى.');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      await widget.backend.verifyPhoneOtp(
        phone: _phoneController.text.trim(),
        code: _otpController.text.trim(),
        role: _apiRole,
      );
      if (mounted) _openDashboard();
    } on BackendException catch (error) {
      if (mounted) setState(() => _errorMessage = error.message);
    } catch (_) {
      if (mounted) {
        setState(() => _errorMessage = 'تعذر الاتصال بالخادم. حاول مرة أخرى.');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('فزعة'),
        centerTitle: true,
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SizedBox(
              width: double.infinity,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _LoginHeading(roleTitle: _roleTitle, otpStep: _otpStep),
                      const SizedBox(height: 24),
                      if (_otpStep)
                        _buildOtpCard(context)
                      else
                        _buildLoginCard(context),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 12),
                        _LoginError(message: _errorMessage!),
                      ],
                      const SizedBox(height: 16),
                      const _ConnectionNotice(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginCard(BuildContext context) {
    return _LoginCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const _SecurityBadge(icon: Icons.lock_outline_rounded),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'بيانات دخول $_roleTitle',
                      style: Theme.of(context).textTheme.titleLarge
                          ?.copyWith(fontSize: 17),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'اختر الطريقة المناسبة لك',
                      style: TextStyle(color: FazaaColors.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _MethodSelector(
            selected: _method,
            onChanged: (method) => setState(() {
              _method = method;
              _errorMessage = null;
            }),
          ),
          const SizedBox(height: 20),
          if (_method == _LoginMethod.phone)
            _buildPhoneForm(context)
          else
            _buildEmailForm(context),
        ],
      ),
    );
  }

  Widget _buildPhoneForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FieldLabel(label: 'رقم الجوال'),
        const SizedBox(height: 8),
        TextFormField(
          key: const ValueKey('login-phone-field'),
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.done,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: _fieldDecoration(
            hint: '7xxxxxxxx',
            prefixIcon: Icons.phone_iphone_rounded,
          ),
          validator: (value) {
            if ((value ?? '').trim().length < 7) {
              return 'أدخل رقم جوال صحيحًا للمتابعة.';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _isSubmitting ? null : _continueWithPhone,
          icon: _isSubmitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.arrow_forward_rounded),
          label: Text(
            _isSubmitting ? 'جارٍ الاتصال...' : 'المتابعة برمز التحقق',
          ),
        ),
      ],
    );
  }

  Widget _buildEmailForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FieldLabel(label: 'البريد الإلكتروني'),
        const SizedBox(height: 8),
        TextFormField(
          key: const ValueKey('login-email-field'),
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.next,
          autofillHints: const [AutofillHints.email],
          decoration: _fieldDecoration(
            hint: 'name@example.com',
            prefixIcon: Icons.mail_outline_rounded,
          ),
          validator: (value) {
            final email = (value ?? '').trim();
            if (!email.contains('@') || !email.split('@').last.contains('.')) {
              return 'أدخل بريدًا إلكترونيًا صحيحًا.';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        _FieldLabel(label: 'كلمة المرور'),
        const SizedBox(height: 8),
        TextFormField(
          key: const ValueKey('login-password-field'),
          controller: _passwordController,
          obscureText: !_showPassword,
          textDirection: TextDirection.ltr,
          textAlign: TextAlign.left,
          textInputAction: TextInputAction.done,
          autofillHints: const [AutofillHints.password],
          decoration:
              _fieldDecoration(
                hint: 'أدخل كلمة المرور',
                prefixIcon: Icons.lock_outline_rounded,
              ).copyWith(
                suffixIcon: IconButton(
                  tooltip: _showPassword
                      ? 'إخفاء كلمة المرور'
                      : 'إظهار كلمة المرور',
                  onPressed: () =>
                      setState(() => _showPassword = !_showPassword),
                  icon: Icon(
                    _showPassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                  ),
                ),
              ),
          validator: (value) {
            if ((value ?? '').length < 6) {
              return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
            }
            return null;
          },
          onFieldSubmitted: (_) => _submitEmail(),
        ),
        Align(
          alignment: AlignmentDirectional.centerEnd,
          child: TextButton.icon(
            onPressed: () => _showNotConnectedMessage(
              'استعادة كلمة المرور غير متاحة بعد في خدمة الخادم الحالية.',
            ),
            icon: const Icon(Icons.key_rounded, size: 17),
            label: const Text('نسيت كلمة المرور؟'),
          ),
        ),
        FilledButton.icon(
          onPressed: _isSubmitting ? null : _submitEmail,
          icon: _isSubmitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.login_rounded),
          label: Text(
            _isSubmitting ? 'جارٍ التحقق...' : 'دخول إلى حساب $_roleTitle',
          ),
        ),
      ],
    );
  }

  Widget _buildOtpCard(BuildContext context) {
    return _LoginCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SecurityBadge(icon: Icons.verified_user_outlined),
          const SizedBox(height: 16),
          Text(
            'تحقق من رقم الجوال',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 6),
          Text(
            'أدخل رمز التحقق المكوّن من 6 أرقام للمتابعة إلى حساب $_roleTitle.',
            style: Theme.of(context).textTheme.bodyLarge
                ?.copyWith(fontSize: 14),
          ),
          const SizedBox(height: 12),
          _OtpDemoNote(developmentCode: _developmentOtpCode),
          const SizedBox(height: 12),
          TextFormField(
            key: const ValueKey('login-otp-field'),
            controller: _otpController,
            keyboardType: TextInputType.number,
            textDirection: TextDirection.ltr,
            textAlign: TextAlign.center,
            maxLength: 6,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: _fieldDecoration(
              hint: '••••••',
              prefixIcon: Icons.password_rounded,
            ).copyWith(counterText: ''),
            validator: (value) {
              if ((value ?? '').length != 6) {
                return 'أدخل رمزًا مكوّنًا من 6 أرقام.';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _isSubmitting ? null : _verifyOtp,
            icon: _isSubmitting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check_circle_outline_rounded),
            label: Text(_isSubmitting ? 'جارٍ التحقق...' : 'تأكيد الرمز'),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _isSubmitting
                ? null
                : () => setState(() {
                    _otpStep = false;
                    _otpController.clear();
                    _errorMessage = null;
                  }),
            icon: const Icon(Icons.edit_outlined, size: 18),
            label: const Text('تعديل رقم الجوال'),
          ),
        ],
      ),
    );
  }

  InputDecoration _fieldDecoration({
    required String hint,
    required IconData prefixIcon,
  }) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(prefixIcon, color: FazaaColors.muted),
      filled: true,
      fillColor: FazaaColors.canvas,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: FazaaColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: FazaaColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: FazaaColors.navy, width: 1.5),
      ),
    );
  }
}

class _LoginHeading extends StatelessWidget {
  const _LoginHeading({required this.roleTitle, required this.otpStep});

  final String roleTitle;
  final bool otpStep;

  @override
  Widget build(BuildContext context) {
    final isOtp = otpStep;
    final title = isOtp ? 'تحقق من رقمك' : 'تسجيل دخول $roleTitle';
    final description = isOtp
        ? 'أكمل التحقق للمتابعة بأمان.'
        : roleTitle == 'العميل'
        ? 'تابع طلباتك واعثر على الخدمة المناسبة لك.'
        : 'تابع طلبات العملاء وأدر ملفك المهني من مكان واحد.';

    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: FazaaColors.border),
            boxShadow: [
              BoxShadow(
                color: FazaaColors.navy.withValues(alpha: 0.07),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Image.asset(
            'assets/brand/fazaah-mark.png',
            fit: BoxFit.contain,
            semanticLabel: 'شعار فزعة',
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'فزعة · دخول آمن',
          style: Theme.of(context).textTheme.labelLarge
              ?.copyWith(color: FazaaColors.gold, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium
              ?.copyWith(fontSize: 27),
        ),
        const SizedBox(height: 6),
        Text(
          description,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontSize: 14),
        ),
      ],
    );
  }
}

class _LoginCard extends StatelessWidget {
  const _LoginCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: FazaaColors.border),
        boxShadow: [
          BoxShadow(
            color: FazaaColors.navy.withValues(alpha: 0.04),
            blurRadius: 22,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _SecurityBadge extends StatelessWidget {
  const _SecurityBadge({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: FazaaColors.navy,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Icon(icon, color: FazaaColors.gold, size: 23),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: FazaaColors.ink,
        fontWeight: FontWeight.w700,
        fontSize: 13,
      ),
    );
  }
}

class _MethodSelector extends StatelessWidget {
  const _MethodSelector({required this.selected, required this.onChanged});

  final _LoginMethod selected;
  final ValueChanged<_LoginMethod> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: FazaaColors.canvas,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Expanded(
            child: _MethodTab(
              label: 'رقم الجوال',
              icon: Icons.phone_iphone_rounded,
              selected: selected == _LoginMethod.phone,
              onTap: () => onChanged(_LoginMethod.phone),
            ),
          ),
          Expanded(
            child: _MethodTab(
              label: 'البريد الإلكتروني',
              icon: Icons.mail_outline_rounded,
              selected: selected == _LoginMethod.email,
              onTap: () => onChanged(_LoginMethod.email),
            ),
          ),
        ],
      ),
    );
  }
}

class _MethodTab extends StatelessWidget {
  const _MethodTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected ? FazaaColors.navy : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            height: 46,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: 17,
                  color: selected ? FazaaColors.gold : FazaaColors.muted,
                ),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: selected ? Colors.white : FazaaColors.muted,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ConnectionNotice extends StatelessWidget {
  const _ConnectionNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: FazaaColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: FazaaColors.gold.withValues(alpha: 0.35)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline_rounded, color: FazaaColors.navy, size: 19),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'تُرسل بيانات الدخول إلى خادم فزعة عبر API. تسجيل الهاتف يحتاج تهيئة مزوّد الرسائل قبل الإنتاج.',
              style: TextStyle(
                color: FazaaColors.ink,
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OtpDemoNote extends StatelessWidget {
  const _OtpDemoNote({this.developmentCode});

  final String? developmentCode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: FazaaColors.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(13),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: FazaaColors.navy,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              developmentCode == null
                  ? 'أدخل رمز التحقق المرسل إلى رقمك. لا يظهر الرمز في بيئة الإنتاج.'
                  : 'رمز التطوير لهذه الجلسة: $developmentCode',
              style: const TextStyle(
                color: FazaaColors.ink,
                fontSize: 12,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginError extends StatelessWidget {
  const _LoginError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: Colors.red.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.red, size: 19),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(fontSize: 12, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
