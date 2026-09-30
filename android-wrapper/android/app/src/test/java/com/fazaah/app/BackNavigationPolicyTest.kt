package com.fazaah.app

import org.junit.Assert.assertEquals
import org.junit.Test

class BackNavigationPolicyTest {
    @Test
    fun authenticatedInnerPagesAlwaysReturnHomeInsteadOfAuthenticationHistory() {
        assertEquals(BackNavigationAction.GO_HOME, BackNavigationPolicy.action("/settings", true))
        assertEquals(BackNavigationAction.GO_HOME, BackNavigationPolicy.action("/auth/phone?mode=register", true))
        assertEquals(BackNavigationAction.GO_HOME, BackNavigationPolicy.action("/welcome", true))
    }

    @Test
    fun authenticatedHomePagesAskBeforeExiting() {
        assertEquals(BackNavigationAction.SHOW_EXIT_CONFIRMATION, BackNavigationPolicy.action("/", true))
        assertEquals(BackNavigationAction.SHOW_EXIT_CONFIRMATION, BackNavigationPolicy.action("/provider-dashboard/", true))
        assertEquals(BackNavigationAction.SHOW_EXIT_CONFIRMATION, BackNavigationPolicy.action("/control-center", true))
    }

    @Test
    fun unauthenticatedAuthScreensAskBeforeExitingInsteadOfClosingImmediately() {
        assertEquals(BackNavigationAction.SHOW_EXIT_CONFIRMATION, BackNavigationPolicy.action("/welcome", false))
        assertEquals(BackNavigationAction.SHOW_EXIT_CONFIRMATION, BackNavigationPolicy.action("/auth/phone", false))
    }

    @Test
    fun unauthenticatedProtectedPagesReturnToWelcome() {
        assertEquals(BackNavigationAction.GO_WELCOME, BackNavigationPolicy.action("/settings", false))
        assertEquals(BackNavigationAction.GO_WELCOME, BackNavigationPolicy.action("/request/new", false))
    }

    @Test
    fun appUrlsDoNotAddDuplicateSlashesToRoutes() {
        assertEquals(
            "https://fazaapublish-7nu8vaaq.manus.space/auth/phone?mode=login",
            BackNavigationPolicy.appUrl("https://fazaapublish-7nu8vaaq.manus.space/", "/auth/phone?mode=login"),
        )
        assertEquals(
            "https://fazaapublish-7nu8vaaq.manus.space/",
            BackNavigationPolicy.appUrl("https://fazaapublish-7nu8vaaq.manus.space", ""),
        )
    }
}
