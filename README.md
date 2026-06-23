
# 📝 QuickNotes

A minimal notes app built with **Next.js** (frontend) and **Supabase** (backend), deployed on **Vercel**.  
QuickNotes lets you add, view, and delete notes in a clean, simple interface.

---

## 🚀 Features
- Add new notes
- View all saved notes
- Delete notes
- Supabase Postgres database integration
- Deployed with Vercel (auto‑redeploy on GitHub push)

---

## 🛠️ Tech Stack
- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth)
- **Deployment**: Vercel
- **Version Control**: GitHub

---

## 📦 Installation

Clone the repo:
```bash
git clone https://github.com/sejalpandey30/quicknotes.git
cd quicknotes
```

Install dependencies:
```bash
npm install
```

Run locally:
```bash
npm run dev
```
App runs at `http://localhost:3000`.

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🗄️ Database Setup

In Supabase SQL Editor, create the `notes` table:

```sql
create table notes (
  id uuid primary key default uuid_generate_v4(),
  content text not null,
  created_at timestamp default now()
);
```

---

## 🚀 Deployment

1. Push code to GitHub.
2. Connect repo to Vercel.
3. Add environment variables in Vercel project settings.
4. Deploy → your app will be live at `https://quicknotes.vercel.app`.

---

## 🔄 Updating the App

- Make changes locally → commit → push to GitHub.  
- Vercel automatically redeploys with the new changes.  
- Use feature branches for preview deployments.

---

## 📸 Demo

Visit the live app: [QuickNotes on Vercel](https://quicknotes-blue.vercel.app)

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you’d like to change.

---

## 📜 License

This project is licensed under the MIT License.




## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
