import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

// 新的批量获取接口
export default async function getI18nValues(keys: string[]): Promise<Record<string, string>> {
  return await invoke("get_i18n_values", { keys });
}

export function useI18n(keys: string[]) {
  const [texts, setTexts] = useState<Record<string, string>>({});

  // 使用 keys 的稳定字符串作为依赖
  const keysString = keys.join(",");

  useEffect(() => {
    let mounted = true;

    async function loadTexts() {
      const values = await getI18nValues(keys);
      if (mounted) {
        setTexts(values);
      }
    }

    loadTexts();

    return () => {
      mounted = false;
    };
  }, [keysString, keys]); // 依赖用提取后的字符串

  return texts;
}
