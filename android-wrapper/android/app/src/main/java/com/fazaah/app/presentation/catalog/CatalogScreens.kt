package com.fazaah.app.presentation.catalog

import android.content.Intent
import android.net.Uri

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.data.repository.AuthRepository
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.navigation.Routes
import com.fazaah.app.presentation.profile.ProfileViewModel

@Composable
fun CatalogShell(catalogRepository: CatalogRepository, authRepository: AuthRepository, onLogout: () -> Unit) {
    val navController = rememberNavController()
    val catalogViewModel: CatalogViewModel = viewModel(factory = CatalogViewModel.factory(catalogRepository))
    val state by catalogViewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        bottomBar = { CatalogBottomBar(navController) },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.Home,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.Home) { HomeScreen(state, catalogViewModel, navController) }
            composable(Routes.Discover) { ServicesScreen(state, catalogViewModel, navController) }
            composable(Routes.Providers) { ProvidersScreen(state, catalogViewModel, navController) }
            composable(
                route = "${Routes.Providers}/{providerId}",
                arguments = listOf(navArgument("providerId") { type = NavType.IntType }),
            ) { entry ->
                ProviderDetailsScreen(catalogRepository, entry.arguments?.getInt("providerId") ?: 0, navController)
            }
            composable(Routes.Profile) { ProfileScreen(authRepository, onLogout) }
        }
    }
}

@Composable
private fun CatalogBottomBar(navController: NavHostController) {
    val current by navController.currentBackStackEntryAsState()
    val currentRoute = current?.destination?.route
    NavigationBar {
        NavigationBarItem(
            selected = currentRoute == Routes.Home,
            onClick = { navController.navigateSingleTop(Routes.Home) },
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            label = { Text("الرئيسية") },
        )
        NavigationBarItem(
            selected = currentRoute == Routes.Discover,
            onClick = { navController.navigateSingleTop(Routes.Discover) },
            icon = { Icon(Icons.Default.Tune, contentDescription = null) },
            label = { Text("الخدمات") },
        )
        NavigationBarItem(
            selected = currentRoute == Routes.Providers || currentRoute?.startsWith("${Routes.Providers}/") == true,
            onClick = { navController.navigateSingleTop(Routes.Providers) },
            icon = { Icon(Icons.Default.Search, contentDescription = null) },
            label = { Text("المهنيون") },
        )
        NavigationBarItem(
            selected = currentRoute == Routes.Profile,
            onClick = { navController.navigateSingleTop(Routes.Profile) },
            icon = { Icon(Icons.Default.Person, contentDescription = null) },
            label = { Text("حسابي") },
        )
    }
}

private fun NavHostController.navigateSingleTop(route: String) {
    navigate(route) { launchSingleTop = true; restoreState = true }
}

@Composable
private fun HomeScreen(state: CatalogUiState, viewModel: CatalogViewModel, navController: NavHostController) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp).background(Color(0xFFF7F8FA)), verticalArrangement = Arrangement.spacedBy(14.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 10.dp, bottom = 24.dp)) {
        item {
            Row(modifier = Modifier.fillMaxWidth().height(70.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically) { Text("صنعاء", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary); Spacer(Modifier.width(4.dp)); Text("⌄", color = MaterialTheme.colorScheme.primary) }
                Image(painterResource(com.fazaah.app.R.drawable.fazaah_logo), contentDescription = "فزعة", modifier = Modifier.height(62.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) { Text("◉", color = MaterialTheme.colorScheme.primary); Text("♙", color = MaterialTheme.colorScheme.primary) }
            }
        }
        item { Text("أهلًا بك", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary) }
        item {
            Card(shape = RoundedCornerShape(25.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary), modifier = Modifier.fillMaxWidth().height(178.dp)) {
                Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.Center) {
                    Text("احتياجك .. نوصلك بالشخص المناسب", color = Color.White.copy(alpha = .75f), style = MaterialTheme.typography.bodySmall)
                    Text("تحتاج شيء؟\nفزعت لك!", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                    Text("ابحث عن المهني المناسب لإنجاز احتياجك بسهولة.", color = Color.White.copy(alpha = .72f), style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = state.search, onValueChange = viewModel::setSearch, placeholder = { Text("ما الذي تحتاجه؟ ابحث عن الخدمة أو المهني...") }, singleLine = true, modifier = Modifier.weight(1f), shape = RoundedCornerShape(28.dp))
                Spacer(Modifier.width(8.dp)); Button(onClick = { viewModel.search(); navController.navigateSingleTop(Routes.Providers) }, modifier = Modifier.size(54.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp), shape = RoundedCornerShape(28.dp)) { Icon(Icons.Default.Search, contentDescription = "بحث") }
            }
        }
        item { SectionTitle("اختر نوع الخدمة") }
        item {
            LazyVerticalGrid(columns = GridCells.Fixed(4), modifier = Modifier.height(210.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(state.categories.take(8)) { category -> CategoryCard(category.name, category.icon) { viewModel.selectCategory(category.id); navController.navigateSingleTop(Routes.Providers) } }
            }
        }
        item {
            Card(shape = RoundedCornerShape(20.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = Color(0xFFFFF5DB)), modifier = Modifier.fillMaxWidth().height(104.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.Center) { Text("محتاج مساعدة أكثر؟", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold); Text("تصفح جميع المهنيين والخدمات المتاحة.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall); TextButton(onClick = { navController.navigateSingleTop(Routes.Providers) }) { Text("تصفح الكل", color = Color(0xFF8C6B00), fontWeight = FontWeight.Bold) } }
            }
        }
        item { SectionTitle("مهنيون متاحون") }
        if (state.isLoading) item { LoadingRow() }
        items(state.providers.take(5)) { provider -> ProviderCard(provider) { navController.navigate("${Routes.Providers}/${provider.id}") } }
        if (state.providers.isEmpty() && !state.isLoading) item { EmptyState("لا توجد نتائج متاحة حاليًا") }
    }
}

@Composable
private fun ServicesScreen(state: CatalogUiState, viewModel: CatalogViewModel, navController: NavHostController) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("الخدمات والتخصصات", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("اختر نوع الخدمة للوصول إلى المهنيين", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(14.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(state.categories) { category ->
                Card(onClick = { viewModel.selectCategory(category.id); navController.navigateSingleTop(Routes.Providers) }, modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(category.icon ?: "🛠️", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(category.name, fontWeight = FontWeight.Bold)
                            Text(category.specialties.take(3).joinToString(" • "), maxLines = 1, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProvidersScreen(state: CatalogUiState, viewModel: CatalogViewModel, navController: NavHostController) {
    Column(modifier = Modifier.fillMaxSize().background(Color(0xFFF7F8FA))) {
        Column(modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.primary).padding(horizontal = 16.dp, vertical = 18.dp)) {
            Text("استعرض المهنيين", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(value = state.search, onValueChange = viewModel::setSearch, modifier = Modifier.fillMaxWidth(), singleLine = true, leadingIcon = { Icon(Icons.Default.Search, null) }, placeholder = { Text("ابحث عن مهني أو خدمة...") }, shape = RoundedCornerShape(14.dp), colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(unfocusedContainerColor = MaterialTheme.colorScheme.background, focusedContainerColor = MaterialTheme.colorScheme.background))
        }
        LazyColumn(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 14.dp)) {
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = state.selectedCategoryId == null, onClick = { viewModel.selectCategory(null) }, label = { Text("الكل") })
                    state.categories.take(3).forEach { category -> FilterChip(selected = state.selectedCategoryId == category.id, onClick = { viewModel.selectCategory(category.id) }, label = { Text(category.name) }) }
                }
            }
            item { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(if (state.isLoading) "جاري البحث..." else "${state.providers.size} مهني", color = MaterialTheme.colorScheme.onSurfaceVariant); if (state.selectedCategoryId != null) Text("فلتر مفعّل", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold) } }
            if (state.isLoading) item { LoadingRow() }
            state.error?.let { error -> item { Text(error, color = MaterialTheme.colorScheme.error) } }
            items(state.providers) { provider -> ProviderCard(provider) { navController.navigate("${Routes.Providers}/${provider.id}") } }
            if (state.providers.isEmpty() && !state.isLoading) item { EmptyState("لا توجد نتائج مطابقة\nجرّب تغيير معايير البحث") }
        }
    }
}

@Composable
private fun ProviderDetailsScreen(repository: CatalogRepository, providerId: Int, navController: NavHostController) {
    val viewModel: ProviderDetailsViewModel = viewModel(factory = ProviderDetailsViewModel.factory(repository, providerId))
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = { navController.popBackStack() }) { Text("رجوع إلى المهنيين") }
        when {
            state.loading -> LoadingRow()
            state.error != null -> Text(state.error!!, color = MaterialTheme.colorScheme.error)
            state.provider != null -> {
                val provider = state.provider!!
                Text(provider.name, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text(provider.categoryName + if (provider.specialty.isNotBlank()) " • ${provider.specialty}" else "", color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (provider.isVerified) Text("✓ مهني موثق", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                Text(provider.bio.ifBlank { "يقدم خدمات مهنية عبر منصة فزعة." })
                Text(listOf(provider.city, provider.district).filter(String::isNotBlank).joinToString(" • "))
                Text(if (provider.isAvailable) "متاح الآن" else "غير متاح حاليًا", color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${provider.phone}"))) }, enabled = provider.phone.isNotBlank(), modifier = Modifier.weight(1f)) { Text("اتصال") }
                    Button(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/${provider.phone}"))) }, enabled = provider.phone.isNotBlank(), modifier = Modifier.weight(1f)) { Text("واتساب") }
                }
                Button(onClick = { /* ربط إنشاء الطلب في المرحلة التالية */ }, modifier = Modifier.fillMaxWidth()) { Text("طلب خدمة") }
            }
        }
    }
}

@Composable
private fun CategoryCard(name: String, icon: String?, onClick: () -> Unit) {
    Card(onClick = onClick, shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxSize().padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(icon ?: "🛠️", style = MaterialTheme.typography.headlineMedium)
            Text(name, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun ProviderCard(provider: com.fazaah.app.domain.model.ProviderSummary, onClick: () -> Unit = {}) {
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(provider.categoryIcon ?: "👤", style = MaterialTheme.typography.headlineSmall)
                Spacer(Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(provider.name, fontWeight = FontWeight.Bold)
                    Text(provider.categoryName + if (provider.specialty.isNotBlank()) " • ${provider.specialty}" else "", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                if (provider.isVerified) Text("موثق", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }
            if (provider.bio.isNotBlank()) Text(provider.bio, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 8.dp))
            Text(listOf(provider.city, provider.district).filter(String::isNotBlank).joinToString(" • "), color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
            Text(if (provider.isAvailable) "متاح الآن" else "غير متاح حاليًا", color = if (provider.isAvailable) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 6.dp))
        }
    }
}

@Composable
private fun SectionTitle(title: String) { Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold) }

@Composable
private fun LoadingRow() { Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator() } }

@Composable
private fun EmptyState(text: String) { Text(text, modifier = Modifier.fillMaxWidth().padding(32.dp), color = MaterialTheme.colorScheme.onSurfaceVariant) }

@Composable
private fun ProfileScreen(authRepository: AuthRepository, onLogout: () -> Unit) {
    val viewModel: ProfileViewModel = viewModel(factory = ProfileViewModel.factory(authRepository))
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("الملف الشخصي", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("إدارة بيانات حسابك ومعلومات التواصل", color = MaterialTheme.colorScheme.onSurfaceVariant)
        when {
            state.loading -> LoadingRow()
            state.user != null -> {
                val user = state.user!!
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(user.name ?: "مستخدم فزعة", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        Text(user.phone ?: "", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(if (user.role == "provider") "مقدم خدمة" else "عميل", color = MaterialTheme.colorScheme.primary)
                    }
                }
                OutlinedTextField(state.name, viewModel::setName, modifier = Modifier.fillMaxWidth(), label = { Text("الاسم") }, singleLine = true)
                OutlinedTextField(state.city, viewModel::setCity, modifier = Modifier.fillMaxWidth(), label = { Text("المدينة") }, singleLine = true)
                OutlinedTextField(state.governorate, viewModel::setGovernorate, modifier = Modifier.fillMaxWidth(), label = { Text("المحافظة") }, singleLine = true)
                OutlinedTextField(state.district, viewModel::setDistrict, modifier = Modifier.fillMaxWidth(), label = { Text("المديرية / المنطقة") }, singleLine = true)
                OutlinedTextField(state.whatsapp, viewModel::setWhatsapp, modifier = Modifier.fillMaxWidth(), label = { Text("رقم الواتساب") }, singleLine = true)
                Button(onClick = viewModel::save, enabled = !state.saving, modifier = Modifier.fillMaxWidth()) {
                    Text(if (state.saving) "جارٍ الحفظ..." else "حفظ بيانات الحساب")
                }
                TextButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("تسجيل الخروج") }
            }
        }
        state.message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
