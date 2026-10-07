import 'package:flutter/material.dart';

import '../../../app/theme/fazaah_theme.dart';

class RoleIntroPage extends StatelessWidget {
  const RoleIntroPage({
    required this.title,
    required this.message,
    required this.icon,
    super.key,
  });

  final String title;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 38,
                  backgroundColor: FazaaColors.navy.withValues(alpha: 0.08),
                  foregroundColor: FazaaColors.navy,
                  child: Icon(icon, size: 34),
                ),
                const SizedBox(height: 20),
                Text('فزعة', style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 10),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back_rounded),
                  label: const Text('العودة إلى البداية'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
