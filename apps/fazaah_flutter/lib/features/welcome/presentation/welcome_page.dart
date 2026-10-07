import 'package:flutter/material.dart';

import '../../../app/app_routes.dart';
import '../../../app/theme/fazaah_theme.dart';

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Align(
                    alignment: Alignment.center,
                    child: Container(
                      width: 104,
                      height: 104,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: FazaaColors.navy.withValues(alpha: 0.08),
                            blurRadius: 26,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/brand/fazaah-mark.png',
                        fit: BoxFit.contain,
                        semanticLabel: 'شعار فزعة',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'فزعة',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium
                        ?.copyWith(color: FazaaColors.navy, fontSize: 34),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'خدمتك أقرب مما تتوقع',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'اختر كيف تريد استخدام فزعة، وسنساعدك للوصول إلى الخطوة التالية.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  _RoleCard(
                    icon: Icons.home_repair_service_rounded,
                    title: 'أحتاج خدمة',
                    subtitle: 'أبحث عن مهني يساعدني',
                    primary: true,
                    onPressed: () =>
                        Navigator.of(context).pushNamed(AppRoutes.customer),
                  ),
                  const SizedBox(height: 12),
                  _RoleCard(
                    icon: Icons.handyman_rounded,
                    title: 'أقدم خدمة',
                    subtitle: 'أستقبل الطلبات بصفتي مهنيًا',
                    onPressed: () =>
                        Navigator.of(context).pushNamed(AppRoutes.provider),
                  ),
                  const SizedBox(height: 24),
                  const _FoundationNote(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onPressed,
    this.primary = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onPressed;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    final content = Row(
      children: [
        Icon(icon, size: 26),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  color: primary ? Colors.white70 : FazaaColors.muted,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        const Icon(Icons.arrow_forward_rounded, size: 20),
      ],
    );

    if (primary) {
      return FilledButton(onPressed: onPressed, child: content);
    }

    return OutlinedButton(onPressed: onPressed, child: content);
  }
}

class _FoundationNote extends StatelessWidget {
  const _FoundationNote();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: FazaaColors.border),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: FazaaColors.muted, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'هذه بنية أولية؛ التسجيل والخدمات قيد النقل إلى Flutter وDart.',
              style: TextStyle(
                color: FazaaColors.muted,
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
