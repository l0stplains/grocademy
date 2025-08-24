# Grocademy

> Seleksi 3 Laboratorium Programming 2025

<p align="center">
  <img width="1280" src="https://github.com/user-attachments/assets/4854f902-6bda-4a0e-87b2-b5ff801a23d5" alt="Grocademy logo">
</p>
<p align="center">
<b>Live:</b> <a href="https://grocademy.store" target=_blank>https://grocademy.store</a>
   ·
<b>API Docs:</b> <a href="https://grocademy.store/docs" target=_blank>https://grocademy.store/docs</a>

</p>

---

## Table of Contents

* [Author](#author)
* [Tech Stack](#tech-stack)
* [Endpoints Made](#endpoints-made)
* [How to Run](#how-to-run)

  * [Local Dev](#local-dev)
  * [Docker (Local)](#docker-local)
  * [Production (Domain + HTTPS)](#production-domain--https)
  * [Admin FE](#admin-fe)
* [Design Patterns](#design-patterns)
* [BONUS Deliverables](#bonus-deliverables)

  * [B02 – Deployment](#b02--deployment)
  * [B03 – Polling](#b03--polling)
  * [B04 – Caching](#b04--caching)
  * [B05 – Lighthouse](#b05--lighthouse)
  * [B06 – Responsive Layout](#b06--responsive-layout)
  * [B07 – API Documentation](#b07--api-documentation)
  * [B08 – SOLID](#b08--solid)
  * [B10 – Additional Feature (Progressive Web App)](#b10--additional-feature-progressive-web-app)
  * [B11 – Bucket](#b11--bucket)
* [Screenshots](#screenshots)

---

## Author

<table>
       <tr align="left">
         <td><b>NIM</b></td>
         <td><b>Name</b></td>
         <td align="center"><b>GitHub</b></td>
       </tr>
       <tr align="left">
         <td>13523002</td>
         <td>Refki Alfarizi</td>
         <td align="center" >
           <div style="margin-right: 20px;">
           <a href="https://github.com/l0stplains" ><img src="https://avatars.githubusercontent.com/u/78079998?v=4" width="48px;" alt=""/> <br/> <sub><b> @l0stplains </b></sub></a><br/>
           </div>
         </td>
       </tr>
</table>

---

## Tech Stack

> [!NOTE]
> See more detailed dependencies and it's version [here](/package.json)

**Runtime & Lang**

* Node.js **20**
* TypeScript **5**
* pnpm **9**

**Backend**

* NestJS **11**
* Prisma **6** (with PostgreSQL)
* class-validator / class-transformer
* Swagger

**Data**

* PostgreSQL **16**
* Redis **7**

**Frontend (SSR)**

* Handlebars (hbs) **4**
* Vanilla CSS & JS
* PWA basics (manifest + icons)

**Infra & DevOps**

* Docker / Docker Compose **v2**
* Caddy **2** (reverse proxy + automatic TLS)
* Cloudflare R2 (S3-compatible object storage)

---

## Endpoints Made

> you can also check it here [https://grocademy.store/docs](https://grocademy.store/docs)

| Endpoint                                  | Method  | Description |
|-------------------------------------------|---------|-------------|
| **Auth**                                  |         |             |
| /api/auth/login                           | POST    | Login user |
| /api/auth/register                        | POST    | Register a new user |
| /api/auth/self                            | GET     | Get current authenticated user |
| **Courses**                               |         |             |
| /api/courses                              | POST    | Create a new course |
| /api/courses                              | GET     | Get all courses |
| /api/courses/{id}                         | GET     | Get a course by ID |
| /api/courses/{id}                         | PUT     | Update a course by ID |
| /api/courses/{id}                         | DELETE  | Delete a course by ID |
| /api/courses/{id}/buy                     | POST    | Buy a course |
| /api/courses/my-courses                   | GET     | Get courses owned by the current user |
| **Modules**                               |         |             |
| /api/courses/{courseId}/modules           | POST    | Create a module for a course |
| /api/courses/{courseId}/modules           | GET     | Get all modules of a course |
| /api/courses/{courseId}/modules/reorder   | PATCH   | Reorder modules of a course |
| /api/modules/{id}                         | GET     | Get a module by ID |
| /api/modules/{id}                         | PUT     | Update a module by ID |
| /api/modules/{id}                         | DELETE  | Delete a module by ID |
| **Users**                                 |         |             |
| /api/users                                | GET     | Get all users |
| /api/users/{id}                           | GET     | Get a user by ID |
| /api/users/{id}                           | PUT     | Update a user by ID |
| /api/users/{id}                           | DELETE  | Delete a user by ID |
| /api/users/{id}/balance                   | POST    | Increment user balance |
| /api/modules/{id}/complete                | PATCH   | Mark a module as complete |
| **Polling**                               |         |             |
| /api/poll/course/{id}/modules             | GET     | Poll course modules updates |
| /api/poll/courses                         | GET     | Poll courses updates |
| /api/poll/version/course/{id}/modules     | GET     | Poll versioned course modules updates |
| /api/poll/version/courses                 | GET     | Poll versioned courses updates |
| **Pages**                                 |         |             |
| /courses                                  | GET     | Courses listing page |
| /courses/{id}                             | GET     | Course details page |
| /courses/{id}/buy                         | POST    | Buy a course (web endpoint) |
| /courses/{id}/modules                     | GET     | Get modules for a course (web) |
| /login                                    | GET     | Login page |
| /login                                    | POST    | Submit login form |
| /logout                                   | POST    | Logout current user |
| /modules/{id}/complete                    | POST    | Complete a module (web) |
| /my-courses                               | GET     | My courses page |
| /register                                 | GET     | Register page |
| /register                                 | POST    | Submit registration form |

---

## How to Run

### Local Dev

> [!IMPORTANT]
> This instruction will be using script aliases, to see the real script go [here](/package.json)


1. **Start DBs**

   ```bash
   pnpm docker:db:start
   pnpm docker:redis:start
   ```
2. **.env**

Copy from [.env.example](/.env.example) and fill it
   
4. **Install & generate**

   ```bash
   pnpm install
   pnpm db:generate

   # if want to seed (will remove any existing data in the database)
   pnpm db:seed
   ```
5. **Run**

   ```bash
   pnpm start:dev
   # http://localhost:3000  |  Swagger: http://localhost:3000/docs
   ```

> Seeder creates one **admin** (`admin / admin123`) and **15 courses**.

### Docker (Local)

* `.env`:
  Setup .env same as before
* Up:

  ```bash
  pnpm docker:up:build
  # http://localhost (or mapped port you use)
  ```

### Production (Domain + HTTPS)

Point your domain’s A record to the server IP, set Caddy, and use production env.

```bash
docker compose pull
docker compose up -d --build
# https://your-domain | /docs
```

### Admin FE

Admin FE is provided by our lovely Labpro Assitants here: [https://labpro-ohl-2025-fe.hmif.dev/](https://labpro-ohl-2025-fe.hmif.dev/)


---

## Design Patterns

### 1) Decorator

> its basically everywhere in nestjs

**Why i use it:**

* **Framework decorators** (`@Controller`, `@Get`, etc.) let us declare routes and metadata cleanly, Nest attaches behavior *around* our methods.
* A **response decorator** (`ResponseInterceptor`) wraps controller outputs into a consistent `{ status, message, data }` envelope and skips wrapping when `__raw` is present—formatting without touching every controller.

### 2) Strategy

**Why i use it:** i want to save files either to **local disk** (dev) or **Cloudflare R2** (prod) without sprinkling `if (prod) ... else ...` across the codebase.

**Where it shows up:** The app depends on an **`IStorageService`** interface; at startup i plug in either **LocalStorageService** or **R2StorageService** based on env. Controllers/services never care which one is active.

### 3) Proxy

**Why i use it:** Reading courses/modules over and over is costly (especially for the database). My **cache layer** acts as a proxy: it serve from Redis if "warm", if not, go to DB and remember the result. When writes happen, it bump **version keys** so clients & cache get invalidated cleanly.

**Where it shows up:** `CacheService.wrap(...)` around Prisma queries; **versioned keys** (`v:*`) signal changes to both the cache and the long-poll endpoints.


---

## BONUS Deliverables

### B02 – Deployment

I chose [DigitalOcean's](https://www.digitalocean.com/) Droplets for hosting my code because i have free credits that will expire ;)

Funny thing is that the [Admin FE](#admin-fe) uses HTTPS so it won't interact with my unencrypted web. So i buy the [grocademy.store](https://grocademy.store) domain and setup Caddy only for it.

### B03 – Polling

The UI updates **without page refresh** after content changes. This uses **long-polling** endpoints (e.g., `/api/poll/courses` and `/api/poll/course/:id/modules`) with **version keys** in Redis. Clients wait until the version increases; when it does, they fetch fresh data. It’s reliable and simple to operate.

<p align="center">
    <img width="1280px" src="/docs/screenshots/long-polling.gif">
</p>
<p align="center"><i>Long-Polling Proof - Live demonstration with New Course Added </i></p>

> You can see the Network tab in Devtools with no caching to see the long-polling requests

### B04 – Caching

Because i want to implement long polling, it would be "bad" for the database to query unchanged data. so i implement caching.

Hot endpoints (course listing/detail and module listing) run through a Redis cache with a **cache-aside** policy. The cache is **invalidated** by bumping version keys whenever a mutation occurs (create/update/delete). This trims DB load and latency. Quick verification: run `docker exec -it grocademy_redis redis-cli` and type `MONITOR`, while you refreshing the browse course page in a close interval it will logs the cache hits.

<p align="center">
    <img width="1280px" src="/docs/screenshots/redis.gif">
</p>
<p align="center"><i>Caching Proof - Live update redis-cli Monitor on Page Refresh </i></p>

### B05 – Lighthouse

> [!IMPORTANT]
> See [Screenshots](#screenshots) for proof

* **Register Page**: (100 + 100 + 100 + 100) / 4 = **100**

* **Login Page**: (100 + 100 + 100 + 100) / 4 = **100**

* **Browse Course Page**: (100 + 94 + 100 + 92) / 4 = **96.5**

* **Course Detail Page**: (100 + 100 + 100 + 91) / 4 = **97.75**

* **My Course Page**: (100 + 98 + 100 + 92) / 4 = **97.5**

* **Course Module Page**: (100 + 95 + 100 + 92) / 4 = **96.75**



### B06 – Responsive Layout

<p align="center">
    <img width="1280px" src="/docs/screenshots/responsive.png">
</p>
<p align="center"><i>Responsive Proof - Mobile Screenshoots</i></p>

### B07 – API Documentation

Interactive docs at `/docs` full with Request and Response example that actually helpful. Also with custom css for minions :)

Check it out [https://grocademy.store/docs](https://grocademy.store/docs)

<p align="center">
    <img width="1280px" src="/docs/screenshots/swagger.png">
</p>
<p align="center"><i>API Documentation Page</i></p>

### B08 – SOLID


**Single Responsibility Principle (SRP)**
I separate concerns strictly (tbh the Nestjs project structure already enforce the programmer to write each code with single responsibility): **controllers** only handle HTTP I/O and delegate; **services** hold pure business rules; **PrismaService** does data access; **CacheService** handles caching and invalidation; **CertificatesService** generates PDFs; **ResponseInterceptor** normalizes the output envelope; and storage implementations only deal with files (Local/R2). If module rules change, it touch `ModulesService` not controllers, interceptors, or storage. That shrinks the blast radius of changes, makes unit tests straightforward, and speeds up bug fixes.

**Open/Closed Principle (OCP)**
The file handling uses an `IStorageService` contract with swappable implementations: **LocalStorageService** for dev and **R2StorageService** for prod. Adding S3 later is just a new class and a provider binding—no edits in controllers/services. Similarly, query result caching goes through `CacheService.wrap(...)`; changing cache policy happens in one place and all endpoints benefit. Consistent API responses are enforced by `ResponseInterceptor`, so new endpoints inherit the same `{ status, message, data }` envelope without editing existing ones.

**Liskov Substitution Principle (LSP)**
Any implementation can replace its abstraction without breaking callers. All storage classes **implement `IStorageService`**, so Local/R2 can be swapped via `STORAGE_TOKEN` and consumers keep working. The same applies to guards: anything implementing `CanActivate` (e.g., `JwtAuthGuard`, `PageAuthGuard`) can be used on a route because the contract is the same. With LSP, i can experiment or replace implementations freely without changing their consumers.

**Interface Segregation Principle (ISP)**
Example, `CacheService` offers a minimal surface, `wrap`  and `bump` (version invalidation), so callers don’t depend on Redis details. DTOs are split per feature (`auth/dto`, `courses/dto`, `modules/dto`, `users/dto`), so controllers import only what they use. ISP keeps classes from depending on methods they don’t need, and changes in one area don’t ripple into others.

**Dependency Inversion Principle (DIP)**
Controllers rely on domain **services**, not Prisma directly. Services that need storage depend on the **`IStorageService` abstraction** via an injection token; whether it’s Local or R2 is a wiring detail. External systems (Redis, R2, etc.) are wrapped by `CacheService`/storage interfaces and selected by DI providers + environment, not `new` calls sprinkled across the code.


### B10 – Additional Feature (Progressive Web App)

I mean, i already implemented responsive layout. just simply adding some manifest and metadata.

<p align="center">
    <img width="480px" src="/docs/screenshots/pwa.gif">
</p>
<p align="center"><i>Progressive Web App Demonstration</i></p>

### B11 – Bucket

I chose Cloudflare R2 because it compatible with Amazon S3 sdk and good free offer.

Course media (PDFs/videos/thumbnails/certificates) are uploaded to **Cloudflare R2** by default. Thumbnails are limited to 8MB, PDFs and videos to 100MB.

> [!NOTE]
> for proof you can inspect element on images and see its source

---

## Screenshots

### **Register Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/register.png">
</p>
<p align="center"><i>Register Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/register-lh.png">
</p>
<p align="center"><i>Register Page Light House Result</i></p>

### **Login Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/login.png">
</p>
<p align="center"><i>Login Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/login-lh.png">
</p>
<p align="center"><i>Login Page Light House Result</i></p>

### **Browse Course Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/courses.png">
</p>
<p align="center"><i>Browse Course Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/courses-lh.png">
</p>
<p align="center"><i>Browse Courses Page Light House Result</i></p>

### **Course Detail Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/course-detail.png">
</p>
<p align="center"><i>Course Detail Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/course-detail-lh.png">
</p>
<p align="center"><i>Course Detail Page Light House Result</i></p>

### **My Course Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/my-courses.png">
</p>
<p align="center"><i>My Course Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/my-courses-lh.png">
</p>
<p align="center"><i>My Course Page Light House Result</i></p>

### **Course Module Page**

<p align="center">
    <img width="1280px" src="/docs/screenshots/module.png">
</p>
<p align="center"><i>Course Module Page</i></p>

<p align="center">
    <img width="1280px" src="/docs/screenshots/module-lh.png">
</p>
<p align="center"><i>Course Module Page Light House Result</i></p>

### **Certificate**

<p align="center">
    <img width="1280px" src="/docs/screenshots/certificate.png">
</p>
<p align="center"><i>Certificate</i></p>


---

<p align="center">
   <img width="32px"  src="/docs/xqcL.png">
   <br>
   <em><strong>AKU CINTA LABPRO</strong></em>
</p>