# push کردن به GitHub — گام به گام

repo شما ساخته شده: **https://github.com/Saeedzed/abzaro**

من نمی‌توانم به حساب GitHub شما لاگین کنم، پس این دو راه را دارید.
**راه ۲ ساده‌تر است** — پیشنهادم همان است.

---

## راه ۱ — با GitHub Desktop (ساده‌ترین، بدون ترمینال)

**۱.** فایل `abzaro-source.zip` را دانلود و از حالت زیپ خارج کنید.

**۲.** اگر Git روی سیستم ندارید، نصب کنید: https://git-scm.com/download/win

**۳.** GitHub Desktop را نصب کنید: https://desktop.github.com

**۴.** GitHub Desktop را باز کنید → `File` → `Add local repository`
→ مسیر پوشهٔ `abzaro` (همان که از zip باز کردید) را انتخاب کنید.

**۵.** اگر گفت «این مخزن گیت نیست»، روی `create a repository` بزنید و مقصد را همان پوشه بگذارید.

**۶.** از منوی بالا `Repository` → `Repository settings` → `Remote`
→ در قسمت `Primary remote repository (origin)` این را بگذارید:

```
https://github.com/Saeedzed/abzaro.git
```

→ `Save`

**۷.** روی دکمهٔ **`Publish branch`** (یا `Push origin`) بزنید.
GitHub Desktop خودش لاگین را می‌پرسد و انجام می‌دهد.

✅ تمام. کد روی GitHub است.

---

## راه ۲ — با ترمینال (اگر Git دارید)

فایل `abzaro-source.zip` را دانلود و از زیپ خارج کنید، سپس در همان پوشه:

```bash
cd abzaro
git push -u origin main
```

`origin` از قبل روی `https://github.com/Saeedzed/abzaro.git` تنظیم شده است.

وقتی نام کاربری و رمز خواست:

- **Username:** `Saeedzed`
- **Password:** ⚠️ رمز GitHub کار **نمی‌کند**. باید Personal Access Token بسازید:

### ساخت توکن (۲ دقیقه)

**۱.** برو به: https://github.com/settings/tokens/new

**۲.** تنظیمات:
- **Note:** `abzaro deploy`
- **Expiration:** `30 days` (یا هر چه خواستید)
- **Scopes:** فقط تیک **`repo`** را بزنید

**۳.** پایین صفحه `Generate token` → توکن را **کپی کنید**
(فرمتش مثل `ghp_xxxxxxxxxxxxxxxxxxxx` است — فقط یک بار نشان داده می‌شود)

**۴.** در ترمینال، به جای رمز، توکن را paste کنید.

> 💡 برای اینکه هر بار توکن نخواهد:
> ```bash
> git config --global credential.helper manager
> ```

---

## بعد از push — وصل کردن Netlify

**۱.** برو https://app.netlify.com → `Add new site` → `Import an existing project`

**۲.** `Deploy with GitHub` → اجازه بده → repo `abzaro` را انتخاب کن

**۳.** تنظیمات را **دست نزن** — از `netlify.toml` خودکار خوانده می‌شود:
- Build command: `npm run build`
- Publish directory: `.next`
- Node: `20`

**۴.** `Deploy site`

**۵.** ⚠️ **مهم‌ترین گام:** `Site configuration` → `Environment variables`
→ `Add a variable`:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-SITE.netlify.app` |

(آدرس واقعی سایت را از بالای صفحهٔ Netlify بردارید)

**۶.** `Deploys` → `Trigger deploy` → `Deploy site`

✅ از این به بعد هر `git push` خودکار منتشر می‌شود.

---

## چک‌لیست

- [ ] `abzaro-source.zip` دانلود و از زیپ خارج شد
- [ ] کد به `github.com/Saeedzed/abzaro` push شد
- [ ] Netlify به repo وصل شد
- [ ] اولین deploy موفق بود
- [ ] `NEXT_PUBLIC_SITE_URL` تنظیم و دوباره deploy شد
- [ ] سایت باز شد و ابزارها کار کردند

---

## اگر گیر کردید

| مشکل | راه‌حل |
| --- | --- |
| `could not read Username` | توکن بسازید (بالا توضیح داده شده) |
| `remote origin already exists` | `git remote set-url origin https://github.com/Saeedzed/abzaro.git` |
| `Updates were rejected` | `git push -u origin main --force` |
| Netlify می‌گوید build failed | مطمئن شوید `netlify.toml` در repo هست |
| سایت بالا می‌آید ولی ابزارها کار نمی‌کنند | `NEXT_PUBLIC_SITE_URL` را تنظیم و دوباره deploy کنید |
