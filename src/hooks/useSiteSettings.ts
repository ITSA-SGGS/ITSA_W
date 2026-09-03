import { useState, useEffect, useCallback } from 'react';
import {
  getPublicSiteSettings,
  updateSiteSetting as serviceUpdateSetting,
  saveBatchSiteSettings as serviceSaveBatch,
} from '../services/siteSettingsService';

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({
    academic_year: '2026–2027',
    telemetry_status: 'SYS: LINUX_KERNEL_STABLE',
    quote_content: {
      quote: 'The best way to predict the future is to invent it.',
      author: 'Alan Kay',
    },
    contact_info: {
      email: 'itsa@sggs.ac.in',
      institution: 'SGGSIE&T, Nanded',
      address: 'Department of Information Technology, SGGSIE&T, Vishnupuri, Nanded - 431606',
    },
    social_links: {
      linkedin: 'https://linkedin.com/company/itsa-sggsiet',
      github: 'https://github.com/itsa-sggsiet',
      instagram: 'https://instagram.com/itsa_sggsiet',
    },
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicSiteSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdateSetting = async (key: string, value: any, description?: string): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      await serviceUpdateSetting(key, value, description);
      await fetchSettings();
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      throw errObj;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async (settingsMap: Record<string, any>): Promise<void> => {
    try {
      setSaving(true);
      setError(null);
      await serviceSaveBatch(settingsMap);
      await fetchSettings();
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj);
      throw errObj;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    error,
    refetch: fetchSettings,
    updateSetting: handleUpdateSetting,
    saveAllSettings: handleSaveAll,
  };
}
