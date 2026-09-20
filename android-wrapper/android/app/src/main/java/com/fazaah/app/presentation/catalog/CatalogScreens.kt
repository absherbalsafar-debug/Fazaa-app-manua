package com.fazaah.app.presentation.catalog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
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
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.fazaah.app.data.repository.CatalogRepository
import com.fazaah.app.presentation.auth.AuthViewModel
import com.fazaah.app.presentation.navigation.Routes

@Composable
fun CatalogShell(catalogRepository: CatalogRepository, onLogout: () -> Unit) {
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
            composable(Routes.Home) { DiscoveryScreen(state, catalogViewModel, navController) }
            composable(Routes.Discover) { ServicesScreen(state, catalogViewModel, navController) }
            composable(Routes.Providers) { ProvidersScreen(state, catalogViewModel) }
            composable(Routes.Profile) { ProfilePlaceholder(onLogout) }
        }
    }
}

@Composable
private fun CatalogBottomBar(navController: NavHostController) {
    val current = navController.currentBackStackEntry?.destination?.route
    NavigationBar {
        NavigationBarItem(
            selected = current == Routes.Home,
            onClick = { navController.navigateSingleTop(Routes.Home) },
            icon = { Icon(Icons.Default.Home, contentDescription = null) },
            label = { Text("الرئيسية") },
        )
        NavigationBarItem(
            selected = current == Routes.Discover,
            onClick = { navController.navigateSingleTop(Routes.Discover) },
            icon = { Icon(Icons.Default.Tune, contentDescription = null) },
            label = { Text("الخدمات") },
        )
        NavigationBarItem(
            selected = current == Routes.Providers,
            onClick = { navController.navigateSingleTop(Routes.Providers) },
            icon = { Icon(Icons.Default.Search, contentDescription = null) },
            label = { Text("المهنيون") },
        )
    }
}

private fun NavHostController.navigateSingleTop(route: String) {
    navigate(route) { launchSingleTop = true; restoreState = true }
}

@Composable
private fun DiscoveryScreen(state: CatalogUiState, viewModel: CatalogViewModel, navController: NavHostController) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Text("اكتشف خدمات فزعة", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("أفضل المهنيين والخدمات في منطقتك", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        item { SectionTitle("الخدمات المتاحة") }
        item {
            LazyVerticalGrid(columns = GridCells.Fixed(2), modifier = Modifier.height(220.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.categories.take(6)) { category ->
                    CategoryCard(category.name, category.icon) { viewModel.selectCategory(category.id); navController.navigateSingleTop(Routes.Providers) }
                }
            }
        }
        item { SectionTitle("مهنيون متاحون") }
        if (state.isLoading) item { LoadingRow() }
        items(state.providers.take(5)) { ProviderCard(it) }
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
private fun ProvidersScreen(state: CatalogUiState, viewModel: CatalogViewModel) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("قائمة المهنيين", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(value = state.search, onValueChange = viewModel::setSearch, modifier = Modifier.fillMaxWidth(), singleLine = true, leadingIcon = { Icon(Icons.Default.Search, null) }, label = { Text("ابحث عن مهني أو خدمة") })
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = state.selectedCategoryId == null, onClick = { viewModel.selectCategory(null) }, label = { Text("الكل") })
            state.categories.take(3).forEach { category -> FilterChip(selected = state.selectedCategoryId == category.id, onClick = { viewModel.selectCategory(category.id) }, label = { Text(category.name) }) }
        }
        Spacer(Modifier.height(8.dp))
        Button(onClick = viewModel::search, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Default.Refresh, null); Spacer(Modifier.width(6.dp)); Text("تحديث النتائج")
        }
        Spacer(Modifier.height(10.dp))
        if (state.isLoading) LoadingRow()
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(state.providers) { ProviderCard(it) }
            if (state.providers.isEmpty() && !state.isLoading) item { EmptyState("لا توجد نتائج مطابقة") }
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
private fun ProviderCard(provider: com.fazaah.app.domain.model.ProviderSummary) {
    Card(modifier = Modifier.fillMaxWidth()) {
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
private fun ProfilePlaceholder(onLogout: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text("الملف الشخصي", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Text("سيتم استكمال هذه الشاشة في المرحلة التالية.")
        Spacer(Modifier.height(16.dp))
        TextButton(onClick = onLogout) { Text("تسجيل الخروج") }
    }
}
