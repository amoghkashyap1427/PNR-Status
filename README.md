# 🚆 IRCTC PNR Status Checker

A futuristic, responsive PNR Status Checker built with **React + Vite**, styled with a dark "night train control room" aesthetic — neon-cyan accents, glassmorphism cards, and Orbitron/Chakra Petch fonts. Powered by the IRCTC Indian Railway PNR Status API via RapidAPI.

---

## 🔗 Live Demo

[pnr-status-17.vercel.app](https://pnr-status-17.vercel.app)

---

## 📸 Preview

| Desktop                                                | Mobile                                                    |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Full two-column layout with train card + status column | Stacked single-column layout with responsive font scaling |

---

## ✨ Features

- 🔍 Real-time PNR status lookup via RapidAPI
- ⌨️ Enter key triggers API call after 10 digits are typed
- 🚉 Displays train name, number, source/destination, journey date, duration
- 💺 Shows coach, seat/berth, and current booking status per passenger
- 📋 Chart preparation status indicator
- 🌙 Dark futuristic UI — Orbitron + Chakra Petch fonts, neon-cyan palette
- 📱 Fully responsive — desktop grid layout collapses to mobile stacked layout
- 🔒 API key protected via environment variables

---

## 🗂️ Project Structure

```
IRCTC/
├── src/
│   ├── components/
│   │   └── PNR_Status/
│   │       ├── Pnr_Number/
│   │       │   ├── index.jsx       # PNR input form + API call
│   │       │   └── style.css       # Input box, button, responsive styles
│   │       └── Pnr_Details/
│   │           ├── index.jsx       # Train details card (dynamic)
│   │           └── style.css       # Grid layout, cards, mobile breakpoints
│   ├── App.jsx                     # Root — lifts state, renders both components
│   ├── App.css                     # Global shell, signal divider
│   ├── main.jsx
│   └── index.css
├── .env                            # API keys (never pushed to GitHub)
├── .env.example                    # Template for contributors
├── .gitignore
├── index.html
└── package.json
```

---

## ⚙️ How It Works

### State Flow (Lifting State Up)

Data flows in one direction — **up then back down** — following React's unidirectional data flow pattern:

```
                    App.jsx
                 [pnrData state 📦]
                /                  \
               ↓                    ↓
         PnrNumber               PnrDetails
      (setPnrData prop)          (data prop)
      "fills the box"            "reads the box"
```

1. `App.jsx` creates `pnrData` state — initially `null`
2. It passes `setPnrData` **down** to `PnrNumber` as a prop
3. When the user enters a PNR and hits scan, `PnrNumber` calls the API
4. On success, it calls `setPnrData(json.data)` — sending data **up** to `App.jsx`
5. `App.jsx` then passes the filled data **down** to `PnrDetails` via the `data` prop
6. `PnrDetails` renders dynamically from `data` — no hardcoded values

### Why Not Pass Directly Between Sibling Components?

In React, data can only flow **parent → child**, never **sibling → sibling**. Since `PnrNumber` and `PnrDetails` are siblings, they communicate by routing data through their shared parent (`App.jsx`). This is called **lifting state up**.

### Conditional Rendering

`PnrDetails` and the "Signal Acquired" divider only render **after** a successful API call:

```jsx
{
  pnrData && (
    <>
      <div className="signalDivider">...</div>
      <PnrDetails data={pnrData} />
    </>
  );
}
```

---

## 🎨 UI Architecture

### Layout System

`PnrDetails` uses **CSS Grid** for its two-panel layout:

```
┌─────────────────────────┬──────────────┐
│      Train Details      │ CURRENT      │
│  (source → dest card)   │ STATUS (CNF) │
│                         ├──────────────┤
│                         │ COACH │ SEAT │
├─────────────────────────┴──────────────┤
│         Chart Preparation Status        │
└─────────────────────────────────────────┘
```

On mobile (`< 700px`) this collapses to:

```
┌─────────────────────┐
│    Train Details    │
├─────────────────────┤
│   CURRENT STATUS    │
├─────────────────────┤
│   COACH  │  SEAT    │
├─────────────────────┤
│  Chart Prep Status  │
└─────────────────────┘
```

### Font Hierarchy

| Font             | Used For                                                              |
| ---------------- | --------------------------------------------------------------------- |
| **Orbitron**     | Train name, station codes, CNF status, coach/seat numbers             |
| **Chakra Petch** | Labels (COACH, SEAT/BERTH, CURRENT STATUS), chart bar text, date pill |
| **Rajdhani**     | Scan button                                                           |

### CSS Class Isolation

Each component has its own `style.css` but since plain CSS is **globally scoped** in React (not CSS Modules), all outer wrapper class names are unique:

- `PnrNumber` uses → `.pnrNumberPage`, `.pnrNumberCenter`
- `PnrDetails` uses → `.pnrDetailsPage`, `.pnrDetailsCenter`
- `App` uses → `.appShell`, `.signalDivider`

This prevents class name collisions that would otherwise cause both components to share the same `min-height: 100vh` rule and create a large empty gap between them.

---

## 🌐 API Reference

**Provider:** [RapidAPI — IRCTC Indian Railway PNR Status](https://rapidapi.com/indianrailways/api/irctc-indian-railway-pnr-status)

**Endpoint:**

```
GET https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/{pnrNumber}
```

**Response Shape:**

```json
{
  "success": true,
  "data": {
    "pnrNumber": "6605699435",
    "trainName": "INTERCITY EXP",
    "trainNumber": "13241",
    "dateOfJourney": "Aug 5, 2026 10:25:00 AM",
    "arrivalDate": "Aug 5, 2026 4:15:00 PM",
    "sourceStation": "BGP",
    "destinationStation": "RJPB",
    "boardingPoint": "BGP",
    "reservationUpto": "RJPB",
    "journeyClass": "3E",
    "quota": "GN",
    "chartStatus": "Chart Not Prepared",
    "bookingFare": 520,
    "distance": 220,
    "passengerList": [
      {
        "passengerSerialNumber": 1,
        "bookingStatus": "CNF",
        "currentStatus": "CNF",
        "bookingCoachId": "B1",
        "bookingBerthNo": 45,
        "bookingBerthCode": "UB"
      }
    ]
  }
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm
- A RapidAPI account with the IRCTC PNR Status API subscribed

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/amoghkashyap1427/PNR-Status.git

# 2. Navigate into the project
cd PNR-Status

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
```

### Environment Variables

Open `.env` and add your keys:

```env
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_RAPIDAPI_HOST=irctc-indian-railway-pnr-status.p.rapidapi.com
```

Get your API key from [rapidapi.com](https://rapidapi.com) — search "IRCTC Indian Railway PNR Status" and subscribe to the free tier.

```bash
# 5. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📦 Deployment (Vercel)

This project is deployed on Vercel with automatic deployments on every push to `main`.

### Deploy Your Own

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
3. Before deploying, add environment variables in Vercel:
   - `VITE_RAPIDAPI_KEY` → your key
   - `VITE_RAPIDAPI_HOST` → `irctc-indian-railway-pnr-status.p.rapidapi.com`
4. Click **Deploy** — Vercel auto-detects Vite, no config needed

Every `git push` after this triggers an automatic redeploy.

---

## 🔒 Security

- API keys are stored in `.env` which is listed in `.gitignore` — never pushed to GitHub
- On Vercel, keys are stored as encrypted environment variables
- `.env.example` is provided for contributors with placeholder values only
- In production, `import.meta.env.VITE_*` variables are injected at build time by Vite

---

## 🛠️ Tech Stack

| Technology         | Purpose                                  |
| ------------------ | ---------------------------------------- |
| React 18           | UI framework                             |
| Vite               | Build tool + dev server                  |
| Plain CSS          | Styling (no Tailwind/Bootstrap)          |
| CSS Grid + Flexbox | Layout system                            |
| Google Fonts       | Orbitron, Chakra Petch, Rajdhani         |
| FontAwesome        | Icons (train, calendar, clipboard, etc.) |
| RapidAPI           | IRCTC PNR Status API                     |
| Vercel             | Hosting + CI/CD                          |
| Git + GitHub       | Version control                          |

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout                                                   |
| ---------- | -------------------------------------------------------- |
| `> 700px`  | Two-column grid — train card (2fr) + status column (1fr) |
| `≤ 700px`  | Single column — all cards stacked vertically             |
| `≤ 380px`  | Extra font-size reduction for very narrow phones         |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Copy `.env.example` to `.env` and add your own API key
4. Make your changes
5. Push and open a Pull Request

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 👤 Author

**Amogh Kashyap**

- GitHub: [@amoghkashyap1427](https://github.com/amoghkashyap1427)
