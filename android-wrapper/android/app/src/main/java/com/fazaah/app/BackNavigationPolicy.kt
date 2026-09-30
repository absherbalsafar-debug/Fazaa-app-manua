package com.fazaah.app

internal enum class BackNavigationAction {
    GO_HOME,
    GO_WELCOME,
    SHOW_EXIT_CONFIRMATION,
}

internal object BackNavigationPolicy {
    fun action(path: String?, isAuthenticated: Boolean): BackNavigationAction {
        val normalizedPath = normalizePath(path)
        if (isAuthenticated) {
            return if (isHomePath(normalizedPath)) {
                BackNavigationAction.SHOW_EXIT_CONFIRMATION
            } else {
                BackNavigationAction.GO_HOME
            }
        }

        return if (isPublicAuthPath(normalizedPath)) {
            BackNavigationAction.SHOW_EXIT_CONFIRMATION
        } else {
            BackNavigationAction.GO_WELCOME
        }
    }

    fun normalizePath(path: String?): String {
        val normalized = path.orEmpty().substringBefore('?').trim().trimEnd('/')
        return normalized.ifEmpty { "/" }
    }

    fun appUrl(baseUrl: String, path: String): String {
        val normalizedBase = baseUrl.trimEnd('/')
        val normalizedPath = path.trimStart('/')
        return if (normalizedPath.isEmpty()) "$normalizedBase/" else "$normalizedBase/$normalizedPath"
    }

    private fun isHomePath(path: String): Boolean =
        path == "/" || path == "/provider-dashboard" || path == "/control-center"

    private fun isPublicAuthPath(path: String): Boolean =
        path == "/welcome" || path == "/welcome-back" ||
            path == "/login" || path == "/register" || path == "/auth" || path.startsWith("/auth/")
}
