**Tandem** is a dynamic web application designed to help users set, track, and achieve SMART goals with AI assistance. Users can:

- Create tailored SMART goals with guidance from AI using a Replicate model
- Track progress and visualize achievements over time
- Check off milestones and completed goals
- Engage with community forums and seek peer support
- Connect and chat with accountability partners
- Adjust goals as needed to maintain motivation and adaptability

**Technologies**: NextJS 14, Shadcn, Tailwind, Lucid, Clerk, Supabase, Lucid icon.

### Core Value Proposition

Tandem supports users in reaching their personal and professional goals by offering a structured, customizable system that combines goal-setting frameworks, real-time progress analytics, and accountability partner matching. Unlike other platforms focused only on habit tracking or community support, Tandem provides an integrated approach that empowers users to grow and succeed alongside others in a shared journey.

### Mission

“To empower individuals in their journey toward self-improvement by turning personal goals into collaborative growth experiences. Tandem is dedicated to adding structure, accountability, and inspiration to everyday lives, helping each user transform aspirations into achievements—not alone, but together.”

### Vision

"To become the world’s leading platform for personal transformation by fostering a global community where individuals connect, support one another, and thrive. Tandem envisions a future where every milestone is celebrated, every goal is shared, and self-improvement becomes a collective experience that shapes a better world."

---

# Core Functionalities

### 1. SMART Goal Creation with AI Assistance
   1. **Goal Input and Initial Setup**
      - Users start by inputting a general goal or aspiration (e.g., “Run a marathon”).
      - An AI model hosted on Replicate (with chat support) guides users to refine their input into a **SMART** goal (Specific, Measurable, Achievable, Relevant, Time-bound).

   2. **Goal Structuring and Breakdown**
      - The AI breaks down the overarching goal into smaller, actionable steps (e.g., daily or weekly tasks).
      - Suggested milestones help users progressively work toward the main goal.

   3. **Goal Review and Finalization**
      - Users can review and adjust the goal structure (e.g., milestones, deadlines) before final confirmation.
      - Once confirmed, the finalized structured goal is saved, and users are directed to the **Goal Tracking and Progress Visualization** section on the dashboard.

---

### 2. Goal Tracking and Progress Visualization
   1. **Daily Task Tracking**
      - Users see a list of daily tasks on their homepage/dashboard, derived from the SMART goal’s initial breakdown.
      - Checkboxes allow users to mark tasks as complete, helping track daily progress.

   2. **Progress Visualization**
      - Progress is displayed in charts, showing percentages, milestones, and streaks.
      - Users can view progress summaries on daily, weekly, and monthly scales.

   3. **Goal Adjustment Options**
      - Users can return to any goal to modify actionable steps, adjust timelines, or even change the final completion date.
      - Adjustments are seamlessly logged to maintain an accurate progress history and provide insights into evolving goals.

---

### 3. Community Engagement

1. **Joining Goal-Based Communities**
   - Users can browse or search for communities aligned with their specific goal types (e.g., fitness, career advancement, learning new skills).
   - Upon joining a community, users gain access to a feed tailored to that goal category.

2. **Community Feed**
   - Each community has a dedicated feed displaying posts from members with similar goals.
   - Posts can include **photos**, **tips**, **tricks**, and **milestones** related to achieving goals.
   - Users can like, comment on, and share posts to foster engagement and support within the community.

3. **Creating and Sharing Posts**
   - Users can create posts to share their own progress, insights, or motivational content with the community.
   - Post options include uploading photos, writing tips or advice, and highlighting personal milestones or achievements.
   - Each post includes the option to tag related goals, helping others in the community find relevant content.

4. **Notifications and Community Updates**
   - Users receive notifications for activity within their communities, such as when someone comments on or likes their posts.
   - Community updates highlight trending posts or significant milestones, keeping members informed and engaged.

---

# Doc

# File Structure

my-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── goals/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── community/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── goals/
│   │   │   └── route.ts
│   │   └── community/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ... (other shadcn components)
│   ├── goals/
│   │   ├── goal-card.tsx
│   │   ├── goal-form.tsx
│   │   └── goal-list.tsx
│   ├── community/
│   │   ├── post-card.tsx
│   │   └── community-list.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   └── progress-chart.tsx
│   └── shared/
│       ├── header.tsx
│       └── footer.tsx
├── lib/
│   ├── utils.ts
│   ├── auth.ts
│   └── db.ts
├── hooks/
│   ├── use-goals.ts
│   └── use-auth.ts
├── types/
│   ├── goal.ts
│   ├── user.ts
│   └── community.ts
├── styles/
│   └── globals.css
└── config/
    └── site.ts



--- 
# Tandem Site Layout

### 1. Landing Page
   - **Purpose**: First point of interaction, introduces Tandem’s core features and encourages sign-up or log-in.
   - **Elements**:
      - **Hero Section**: Brief overview of Tandem’s purpose (SMART goals, community, progress tracking).
      - **Sign-Up Button**: Directs new users to the onboarding flow.
      - **Log-In Button**: Redirects returning users to the dashboard.
      - **Feature Highlights**: Short description and icons representing key features (e.g., AI-guided goal setting, community engagement, progress visualization).

---

### 2. Onboarding Flow (for First-Time Users)
   - **Purpose**: Guides new users through the initial SMART goal creation process.
   - **Steps**:
      - **Step 1: Goal Input**
         - Text field where users enter a general goal or aspiration.
         - Example Placeholder: "I want to run a marathon."
      - **Step 2: SMART Goal Structuring (AI Assistance)**
         - AI guides users to refine the goal into a SMART format (Specific, Measurable, Achievable, Relevant, Time-bound).
         - Suggestions for daily/weekly tasks and milestones.
      - **Step 3: Goal Confirmation**
         - Users review the final structured goal and confirm it to proceed.
         - Once confirmed, users are directed to the dashboard with the new goal saved.

---

### 3. Dashboard/Homepage
   - **Purpose**: Central hub where users can view their daily goals, track progress, and navigate other features.
   - **Elements**:
      - **Daily Goal Tracker**: List of actionable tasks for the day, derived from SMART goal breakdown.
      - **Progress Visualization**: Interactive chart showing goal completion percentages, streaks, and milestones.
      - **Quick Access Links**:
         - **Community Tab**: Shortcut to community page for user engagement.
         - **Profile**: Link to the user’s profile and settings.
      - **Motivational Element**: Daily quote or message for inspiration, displayed prominently.

---

### 4. Community Page
   - **Purpose**: Enables users to join groups based on shared goal types and view community posts.
   - **Elements**:
      - **Community Categories**: Users can browse or search for goal-based communities (e.g., fitness, personal development, career).
      - **Community Feed**: Each community has a feed displaying member posts, including photos, tips, tricks, and milestones.
      - **Create New Post**: Button to open a modal for users to add photos, share progress, or provide insights.
      - **Engagement Features**: Users can like, comment on, and share posts to foster a supportive environment.

---

### 5. Profile Page
   - **Purpose**: Allows users to view and manage their account details, settings, and achievements.
   - **Elements**:
      - **User Information**: Display profile picture, username, and bio.
      - **Achievements & Milestones**: List of completed goals and unlocked badges.
      - **Settings**:
         - Toggle notifications.
         - Privacy options for goal visibility.
         - Account settings, including theme adjustments and logout option.

---

### Flow Summary:
   - **Landing Page** → **Onboarding (if new user)** → **Dashboard/Homepage**  
   - From Dashboard: Access **Community Page** and **Profile Page**

---

# Development Requirements

### 1. Detailed Functional Requirements for Each Feature
   - **SMART Goal Creation**:
      - Define interactions with the AI model on Replicate, including goal breakdown and milestone suggestions.
      - User can modify goals manually, with a confirmation option before saving.
   - **Goal Tracking**:
      - Daily task tracking, visualization formats, and goal adjustments should be defined, including how incomplete tasks roll over.
   - **Community Features**:
      - Community search, post types (photo, text, milestones), and notification settings for engagement.

### 2. Database Structure & Data Flow
   - **User Profiles**: Basic attributes like username, bio, joined communities.
   - **Goals**: Creation date, milestones, progress, due date.
   - **Community Posts**: Post type, author, goal association, likes/comments.

### 3. User Interface (UI) Design Specifications
   - **Components**: Tailwind and Shadcn for buttons, modals, etc.
   - **Responsive Design**: Defined layouts for mobile, tablet, desktop.

### 4. User Experience (UX) Flow
   - **Onboarding**: From landing page to dashboard, covering goal setup.
   - **Returning User Flow**: Login to dashboard, showing notifications, reminders.
   - **Error Handling**: Outline error guidance for common issues.

### 5. Integration Requirements
   - **Replicate (AI)**: API calls for goal refining.
   - **Clerk (Auth)**: Login/signup, including any MFA or recovery.
   - **Supabase (Data Storage)**: Goals, community posts, settings.
   - **Lucid (Icons)**: Standardized icons for navigation clarity.

### 6. Feature Roadmap and Milestones
   - Phase 1: Page and navigation structure
   - Phase 2: Onboarding and SMART goal creation
   - Phase 3: Goal tracking with task lists and visualization
   - Phase 4: Community engagement features



   # Notes

   * Ability to add any task to the daily list and add for any date in the calendar. 