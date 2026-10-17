import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { basePath, localizedPath } from '../seo/pages'

// Links between public pages stay in the current language, and switching language on a public
// page moves to its counterpart URL (OPS-003 R-03, R-05).
export function useLocalePath() {
  const { locale } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const localePath = (path) => localizedPath(path, locale.value)

  const switchLocale = (next) => {
    if (route.meta.seo) {
      router.push(localizedPath(basePath(route.path), next))
    } else {
      locale.value = next
    }
  }

  return { locale, localePath, switchLocale }
}
