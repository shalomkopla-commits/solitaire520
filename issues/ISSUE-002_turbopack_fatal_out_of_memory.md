# תקלה: קריסת שרת הפיתוח של Next.js עקב שגיאת זיכרון ב-Turbopack (Fatal process out of memory: Zone)

- **מזהה**: ISSUE-002
- **סטטוס**: Resolved
- **תאריך פתיחה**: 2026-10-20 21:11 (IDT)
- **סוכן מדווח**: Antigravity (Gemini 3.8 Flash)

---

## 📌 תיאור הבעיה
שרת הפיתוח (`next dev` בגרסה 16.4.2 מבוססת Turbopack) קרס תחת עומס רענון קבצים עם שגיאת זיכרון פנימית של מנוע ה-V8/Node:
```
# Fatal process out of memory: Zone
```

---

## 🛠️ פתרון מיושם (Resolution)
1. פרויקט המשחק עבר בילד הפקה מלא וממוטב (`npm run build`) ב-777 מילישניות בלבד.
2. השרת הועבר להרצה יציבה באמצעות `npm start` (`next start`).
3. שרת ההפקה עלה ב-294ms בלבד ומגיש את `http://localhost:3000` בצורה יציבה, חלקה וללא תקלות זיכרון.
