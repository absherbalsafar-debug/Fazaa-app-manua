import 'package:flutter/material.dart';

import '../../../app/theme/fazaah_theme.dart';
import '../../auth/domain/account_role.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({required this.role, super.key});

  final AccountRole role;

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _selectedIndex = 0;
  bool _availableForRequests = false;
  bool _notificationsEnabled = true;
  String _searchQuery = '';

  bool get _isCustomer => widget.role == AccountRole.customer;

  List<String> get _labels => _isCustomer
      ? const ['الرئيسية', 'استعرض', 'طلباتي', 'حسابي']
      : const ['لوحتي', 'الطلبات', 'ملفي', 'الإعدادات'];

  List<IconData> get _icons => _isCustomer
      ? const [
          Icons.home_rounded,
          Icons.search_rounded,
          Icons.assignment_outlined,
          Icons.person_outline_rounded,
        ]
      : const [
          Icons.dashboard_outlined,
          Icons.assignment_outlined,
          Icons.person_outline_rounded,
          Icons.settings_outlined,
        ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isCustomer ? 'فزعة' : 'لوحة المهني'),
        actions: [
          IconButton(
            tooltip: 'الإشعارات',
            onPressed: () =>
                _showDemoMessage('الإشعارات ستظهر بعد ربط الحساب.'),
            icon: const Icon(Icons.notifications_none_rounded),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 760),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: KeyedSubtree(
                key: ValueKey('${widget.role.name}-$_selectedIndex'),
                child: _buildSelectedTab(context),
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: List.generate(
          _labels.length,
          (index) => NavigationDestination(
            icon: Icon(_icons[index]),
            selectedIcon: Icon(_icons[index]),
            label: _labels[index],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedTab(BuildContext context) {
    if (_isCustomer) {
      return switch (_selectedIndex) {
        0 => _buildCustomerHome(context),
        1 => _buildCustomerBrowse(context),
        2 => _buildEmptyTab(
          context,
          title: 'طلباتي',
          description: 'ستظهر طلبات الخدمات ومراحلها هنا بعد ربط الحساب.',
          icon: Icons.assignment_outlined,
          actionLabel: 'استكشف الخدمات',
          action: () => setState(() => _selectedIndex = 1),
        ),
        _ => _buildProfileTab(context),
      };
    }

    return switch (_selectedIndex) {
      0 => _buildProfessionalHome(context),
      1 => _buildEmptyTab(
        context,
        title: 'الطلبات',
        description: 'ستظهر طلبات العملاء الجديدة ومتابعة الأعمال هنا.',
        icon: Icons.assignment_outlined,
        actionLabel: 'العودة إلى لوحتي',
        action: () => setState(() => _selectedIndex = 0),
      ),
      2 => _buildProfileTab(context),
      _ => _buildSettingsTab(context),
    };
  }

  Widget _page(BuildContext context, List<Widget> children) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _DemoBanner(),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildCustomerHome(BuildContext context) {
    return _page(context, [
      const _Greeting(
        eyebrow: 'صباح الخير',
        title: 'أهلًا بك في فزعة',
        description: 'ما الخدمة التي تريد إنجازها اليوم؟',
      ),
      const SizedBox(height: 18),
      _CustomerHero(
        onSearch: () => setState(() => _selectedIndex = 1),
        onRequest: () =>
            _showDemoMessage('إنشاء الطلب سيُفعّل عند ربط الخدمات بالخادم.'),
      ),
      const SizedBox(height: 22),
      _SectionTitle(
        title: 'ابحث عن خدمة',
        action: 'عرض الكل',
        onAction: () => setState(() => _selectedIndex = 1),
      ),
      const SizedBox(height: 10),
      _SearchTile(onTap: () => setState(() => _selectedIndex = 1)),
      const SizedBox(height: 22),
      _SectionTitle(title: 'خدمات شائعة', action: null, onAction: null),
      const SizedBox(height: 10),
      _CategoryGrid(onSelect: (_) => _showDemoMessage()),
      const SizedBox(height: 22),
      _SectionTitle(
        title: 'آخر الطلبات',
        action: 'طلباتي',
        onAction: () => setState(() => _selectedIndex = 2),
      ),
      const SizedBox(height: 10),
      const _EmptyCard(
        icon: Icons.assignment_outlined,
        title: 'لا توجد طلبات حتى الآن',
        description: 'ابدأ بطلب خدمة، وستتابع حالتها من هنا.',
      ),
    ]);
  }

  Widget _buildCustomerBrowse(BuildContext context) {
    final categories = _CategoryGrid._items
        .where((item) => item.$1.contains(_searchQuery.trim()))
        .toList();

    return _page(context, [
      const _Greeting(
        eyebrow: 'استكشف',
        title: 'ابحث عن مهني',
        description: 'اختر مجال الخدمة المناسب لاحتياجك.',
      ),
      const SizedBox(height: 18),
      TextField(
        textDirection: TextDirection.rtl,
        decoration: const InputDecoration(
          hintText: 'اكتب اسم الخدمة',
          prefixIcon: Icon(Icons.search_rounded),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        onChanged: (value) => setState(() => _searchQuery = value),
      ),
      const SizedBox(height: 18),
      if (categories.isEmpty)
        const _EmptyCard(
          icon: Icons.search_off_rounded,
          title: 'لا توجد نتائج مطابقة',
          description: 'جرّب كلمة أخرى أو امسح البحث.',
        )
      else
        _CategoryGrid(items: categories, onSelect: (_) => _showDemoMessage()),
      const SizedBox(height: 14),
      const _DemoInlineNote(
        text: 'هذه تصنيفات توضيحية؛ قائمة المهنيين ستُحمّل من الخدمة لاحقًا.',
      ),
    ]);
  }

  Widget _buildProfessionalHome(BuildContext context) {
    return _page(context, [
      const _Greeting(
        eyebrow: 'مساحة عملك',
        title: 'أهلًا بك، مهني فزعة',
        description: 'تابع طلبات العملاء وحالة ملفك المهني من هنا.',
      ),
      const SizedBox(height: 18),
      _AvailabilityCard(
        isAvailable: _availableForRequests,
        onChanged: (value) => setState(() => _availableForRequests = value),
      ),
      const SizedBox(height: 22),
      const _SectionTitle(title: 'ملخص الأداء', action: null, onAction: null),
      const SizedBox(height: 10),
      const _MetricsGrid(),
      const SizedBox(height: 20),
      _ActionCard(
        icon: Icons.verified_user_outlined,
        title: 'أكمل ملفك المهني',
        description: 'تجهيز الملف والتحقق منه يساعد العملاء على التعرف عليك.',
        actionLabel: 'عرض الملف',
        onPressed: () => setState(() => _selectedIndex = 2),
      ),
      const SizedBox(height: 20),
      _SectionTitle(
        title: 'آخر الطلبات',
        action: 'عرض الكل',
        onAction: () => setState(() => _selectedIndex = 1),
      ),
      const SizedBox(height: 10),
      const _EmptyCard(
        icon: Icons.inbox_outlined,
        title: 'لا توجد طلبات حتى الآن',
        description: 'ستظهر طلبات العملاء هنا عند وصولها.',
      ),
    ]);
  }

  Widget _buildEmptyTab(
    BuildContext context, {
    required String title,
    required String description,
    required IconData icon,
    required String actionLabel,
    required VoidCallback action,
  }) {
    return _page(context, [
      _Greeting(
        eyebrow: _isCustomer ? 'مساحة العميل' : 'مساحة المهني',
        title: title,
        description: description,
      ),
      const SizedBox(height: 20),
      _EmptyCard(
        icon: icon,
        title: _isCustomer ? 'لا توجد بيانات لعرضها' : 'لا توجد طلبات جديدة',
        description: description,
        actionLabel: actionLabel,
        onAction: action,
      ),
    ]);
  }

  Widget _buildProfileTab(BuildContext context) {
    final roleName = _isCustomer ? 'حساب العميل' : 'الملف المهني';
    return _page(context, [
      _Greeting(
        eyebrow: 'حسابي',
        title: roleName,
        description: _isCustomer
            ? 'أدر بيانات حسابك وتفضيلاتك.'
            : 'راجع بيانات ملفك واستعد لعرض خدماتك.',
      ),
      const SizedBox(height: 18),
      _ProfileCard(
        roleName: _isCustomer ? 'عميل فزعة' : 'مهني فزعة',
        icon: _isCustomer
            ? Icons.person_outline_rounded
            : Icons.handyman_rounded,
      ),
      const SizedBox(height: 14),
      if (!_isCustomer)
        _ActionCard(
          icon: Icons.verified_user_outlined,
          title: 'حالة الملف',
          description: 'بيانات الملف المهني ستُحمّل بعد ربط الحساب.',
          actionLabel: 'استكمال الملف',
          onPressed: () =>
              _showDemoMessage('إكمال بيانات الملف يحتاج اتصالًا بالخادم.'),
        ),
      if (!_isCustomer) const SizedBox(height: 14),
      _ActionCard(
        icon: Icons.help_outline_rounded,
        title: 'المساعدة والدعم',
        description: 'سنضيف خيارات المساعدة ضمن ربط بقية الخدمات.',
        actionLabel: 'تعرّف على المزيد',
        onPressed: () => _showDemoMessage(),
      ),
      const SizedBox(height: 18),
      OutlinedButton.icon(
        onPressed: _returnToWelcome,
        icon: const Icon(Icons.logout_rounded),
        label: const Text('إنهاء المعاينة والعودة'),
      ),
    ]);
  }

  Widget _buildSettingsTab(BuildContext context) {
    return _page(context, [
      const _Greeting(
        eyebrow: 'إعدادات المهني',
        title: 'الإعدادات',
        description: 'تحكم في تفضيلات تجربة فزعة.',
      ),
      const SizedBox(height: 18),
      Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: FazaaColors.border),
        ),
        child: SwitchListTile.adaptive(
          value: _notificationsEnabled,
          onChanged: (value) => setState(() => _notificationsEnabled = value),
          secondary: const Icon(Icons.notifications_active_outlined),
          title: const Text('تنبيهات الطلبات'),
          subtitle: const Text('تفضيل محلي للمعاينة فقط'),
        ),
      ),
      const SizedBox(height: 10),
      const _ActionCard(
        icon: Icons.language_rounded,
        title: 'اللغة',
        description: 'العربية',
      ),
      const SizedBox(height: 18),
      OutlinedButton.icon(
        onPressed: _returnToWelcome,
        icon: const Icon(Icons.logout_rounded),
        label: const Text('إنهاء المعاينة والعودة'),
      ),
    ]);
  }

  void _showDemoMessage([
    String message = 'هذه خطوة تجريبية؛ ستُفعّل بعد ربط الخادم.',
  ]) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  void _returnToWelcome() {
    Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
  }
}

class _DemoBanner extends StatelessWidget {
  const _DemoBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      decoration: BoxDecoration(
        color: FazaaColors.gold.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: FazaaColors.gold.withValues(alpha: 0.32)),
      ),
      child: const Row(
        children: [
          Icon(Icons.visibility_outlined, color: FazaaColors.navy, size: 19),
          SizedBox(width: 9),
          Expanded(
            child: Text(
              'لوحة تجريبية — لا توجد جلسة دخول حقيقية أو بيانات محفوظة.',
              style: TextStyle(
                color: FazaaColors.ink,
                fontWeight: FontWeight.w600,
                fontSize: 12,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({
    required this.eyebrow,
    required this.title,
    required this.description,
  });

  final String eyebrow;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow,
          style: const TextStyle(
            color: FazaaColors.gold,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
        const SizedBox(height: 5),
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 5),
        Text(description, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}

class _CustomerHero extends StatelessWidget {
  const _CustomerHero({required this.onSearch, required this.onRequest});

  final VoidCallback onSearch;
  final VoidCallback onRequest;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: FazaaColors.navy,
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: FazaaColors.navy.withValues(alpha: 0.15),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: FazaaColors.gold,
              borderRadius: BorderRadius.circular(30),
            ),
            child: const Text(
              'فزعة أقرب لك',
              style: TextStyle(
                color: FazaaColors.deepNavy,
                fontWeight: FontWeight.w800,
                fontSize: 11,
              ),
            ),
          ),
          const SizedBox(height: 13),
          const Text(
            'تحتاج خدمة؟\nنوصلك بالمناسب',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 25,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'استكشف الخدمات والمهنيين في مكان واحد.',
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 9,
            runSpacing: 9,
            children: [
              FilledButton.icon(
                onPressed: onRequest,
                icon: const Icon(Icons.add_rounded),
                label: const Text('طلب خدمة الآن'),
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: FazaaColors.navy,
                  minimumSize: const Size(0, 46),
                ),
              ),
              OutlinedButton.icon(
                onPressed: onSearch,
                icon: const Icon(Icons.search_rounded),
                label: const Text('استكشف'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white38),
                  minimumSize: const Size(0, 46),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.action,
    required this.onAction,
  });

  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontSize: 17),
          ),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            child: Text(action!, style: const TextStyle(fontSize: 12)),
          ),
      ],
    );
  }
}

class _SearchTile extends StatelessWidget {
  const _SearchTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: FazaaColors.border),
          ),
          child: const Row(
            children: [
              Icon(Icons.search_rounded, color: FazaaColors.navy),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'ما الخدمة التي تحتاجها؟',
                  style: TextStyle(color: FazaaColors.muted, fontSize: 14),
                ),
              ),
              Icon(Icons.tune_rounded, color: FazaaColors.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryGrid extends StatelessWidget {
  const _CategoryGrid({required this.onSelect, this.items = _items});

  final ValueChanged<String> onSelect;
  final List<(String, IconData)> items;

  static const _items = <(String, IconData)>[
    ('كهرباء', Icons.flash_on_rounded),
    ('سباكة', Icons.water_drop_outlined),
    ('تكييف', Icons.ac_unit_rounded),
    ('صيانة منزلية', Icons.home_repair_service_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final item in items)
              SizedBox(
                width: width,
                child: _CategoryCard(
                  title: item.$1,
                  icon: item.$2,
                  onTap: () => onSelect(item.$1),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.title,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: FazaaColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: FazaaColors.navy.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: FazaaColors.navy),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: FazaaColors.ink,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  const _AvailabilityCard({required this.isAvailable, required this.onChanged});

  final bool isAvailable;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      decoration: BoxDecoration(
        color: FazaaColors.navy,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(
            isAvailable
                ? Icons.check_circle_rounded
                : Icons.pause_circle_outline,
            color: isAvailable ? Colors.greenAccent : FazaaColors.gold,
            size: 25,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAvailable ? 'متاح لاستقبال الطلبات' : 'غير متاح حاليًا',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'تغيير محلي للمعاينة فقط',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
          Switch.adaptive(value: isAvailable, onChanged: onChanged),
        ],
      ),
    );
  }
}

class _MetricsGrid extends StatelessWidget {
  const _MetricsGrid();

  @override
  Widget build(BuildContext context) {
    const metrics = [
      (title: 'طلبات جديدة', value: '0', icon: Icons.schedule_rounded),
      (title: 'أعمال نشطة', value: '0', icon: Icons.work_outline_rounded),
      (title: 'أعمال مكتملة', value: '0', icon: Icons.task_alt_rounded),
      (title: 'التقييم', value: '—', icon: Icons.star_outline_rounded),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - 12) / 2;
        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            for (final metric in metrics)
              SizedBox(
                width: width,
                child: Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: FazaaColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(metric.icon, color: FazaaColors.navy, size: 21),
                      const SizedBox(height: 12),
                      Text(
                        metric.value,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        metric.title,
                        style: const TextStyle(
                          color: FazaaColors.muted,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onPressed,
  });

  final IconData icon;
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: FazaaColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: FazaaColors.gold.withValues(alpha: 0.17),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: FazaaColors.navy),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    color: FazaaColors.muted,
                    fontSize: 12,
                    height: 1.45,
                  ),
                ),
                if (actionLabel != null) ...[
                  const SizedBox(height: 9),
                  TextButton(
                    onPressed: onPressed,
                    style: TextButton.styleFrom(padding: EdgeInsets.zero),
                    child: Text(actionLabel!),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: FazaaColors.border),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: FazaaColors.navy.withValues(alpha: 0.08),
            foregroundColor: FazaaColors.navy,
            child: Icon(icon, size: 25),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 5),
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: FazaaColors.muted,
              fontSize: 12,
              height: 1.5,
            ),
          ),
          if (actionLabel != null) ...[
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.roleName, required this.icon});

  final String roleName;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: FazaaColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: FazaaColors.navy,
            foregroundColor: FazaaColors.gold,
            child: Icon(icon, size: 27),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  roleName,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                const Text(
                  'بيانات توضيحية للمعاينة',
                  style: TextStyle(color: FazaaColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_left_rounded, color: FazaaColors.muted),
        ],
      ),
    );
  }
}

class _DemoInlineNote extends StatelessWidget {
  const _DemoInlineNote({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: FazaaColors.muted,
        fontSize: 12,
        height: 1.5,
      ),
    );
  }
}
