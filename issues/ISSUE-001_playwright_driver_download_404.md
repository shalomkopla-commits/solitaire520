# תקלה: שגיאת הורדת דרייבר Playwright בסוכן הדפדפן הפנימי (Playwright Driver Download 404)

- **מזהה**: ISSUE-001
- **סטטוס**: Open (External Dependency / Environment Issue)
- **תאריך פתיחה**: 2026-10-20 20:58 (IDT)
- **סוכן מדווח**: Antigravity (Gemini 3.8 Flash)

---

## 📌 תיאור הבעיה
במהלך ניסיון להפעיל את `browser_subagent` על מנת לבדוק ולתעד אוטומטית את המשחק ב-`http://localhost:3000`, הכלי הפנימי `open_browser_url` נכשל בהקמת ה-browser context עקב שגיאת הורדה של קובץ הדרייבר ממאגרי ה-CDN של מיקרוסופט:
```
failed to create browser context: failed to run playwright manager: failed to install playwright: could not install driver: could not install driver: error: got non 200 status code: 404 (404 Not Found) from https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip
error: got non 200 status code: 404 (404 Not Found) from https://playwright-akamai.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip
error: got non 200 status code: 404 (404 Not Found) from https://playwright-verizon.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip
```

---

## 🔍 צעדים לשחזור (Steps to Reproduce)
1. הפעלת `browser_subagent` ב-Windows.
2. ניסיון פתיחת כל כתובת URL (כולל `http://localhost:3000`).
3. מנהל ה-Playwright הפנימי מנסה להוריד גרסה `playwright-1.57.0-win32_x64.zip` ומקבל קוד שגיאה 404 מה-CDN.

---

## 🛠️ מעקף ופתרון חלופי (Workaround)
1. שרת הפיתוח של Next.js רץ בצורה תקינה לחלוטין ברקע על פורט 3000.
2. פקודת `Start-Process "http://localhost:3000"` מפעילה ישירות את דפדפן ברירת המחדל של המשתמש במערכת (Chrome/Edge) ומציגה את המשחק באופן חי ואינטראקטיבי מלא.
3. נוצר קובץ Artifact ויזואלי מלא עם רינדור גרפי של לוח המשחק והממשק.
