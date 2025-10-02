export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()

  // 在開發環境中，如果目標頁面不是登入頁，直接模擬登入並跳轉
  // if (process.env.NODE_ENV !== 'production' && to.path !== '/auth/login') {
  //   console.log('Development mode: Bypassing auth middleware, direct login.')
  //   const mockUser = {
  //     id: 1,
  //     username: 'admin',
  //     email: 'admin@example.com',
  //     name: '系統管理員',
  //     roles: ['admin'],
  //     permissions: ['all_access'],
  //     is_admin: true,
  //     is_manager: false,
  //     token: 'mock-jwt-token-for-development'
  //   }
  //   authStore.setUser(mockUser)
  //   if (process.client) {
  //     sessionStorage.setItem('user-profile', JSON.stringify(mockUser))
  //   }

  //   // 確保狀態更新後再重定向
  //   await nextTick()
  //   if (to.path === '/' || to.path === '/auth/login') {
  //     return navigateTo('/dashboard/analytics') // 重定向到儀表板頁面
  //   } else {
  //     return // 允許導航到其他目標頁面
  //   }
  // }

  console.log('Auth middleware - 來源頁面:', from?.path, '目標頁面:', to.path)
  console.log('Auth middleware - 當前登入狀態:', authStore.isLoggedIn)

  // 如果是登入頁面，直接允許通過
  if (to.path === '/auth/login') {
    return
  }

  // 如果已經登入，直接允許通過（避免重複驗證）
  if (authStore.isLoggedIn) {
    console.log('用戶已登入，直接通過')
    return
  }

  // 等待初始化完成 - 使用本地 token 判斷，速度更快
  if (process.client) {
    try {
      // 快速初始化，不需要等待 DOM
      const authSuccess = await authStore.waitForInitialization()

      console.log('Auth middleware - 初始化結果:', authSuccess)
      console.log('Auth middleware - 初始化後登入狀態:', authStore.isLoggedIn)

      // 初始化後立即檢查登入狀態，不需要額外等待
      if (!authStore.isLoggedIn) {
        console.log('用戶未登入，重定向到登入頁')
        // 保存原始目標路徑，避免循環重定向
        const redirectPath = to.path !== '/' && to.path !== '/auth/login' ? to.path : undefined
        return navigateTo(redirectPath ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}` : '/auth/login')
      }

      console.log('用戶已登入，允許通過')

    } catch (error) {
      console.error('Auth middleware - 初始化失敗:', error)
      // 保存原始目標路徑
      const redirectPath = to.path !== '/' && to.path !== '/auth/login' ? to.path : undefined
      return navigateTo(redirectPath ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}` : '/auth/login')
    }
  } else {
    // Server side: 如果沒有登入狀態就重定向
    if (!authStore.isLoggedIn) {
      // 保存原始目標路徑
      const redirectPath = to.path !== '/' ? to.path : undefined
      return navigateTo(redirectPath ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}` : '/auth/login')
    }
  }
})