--
-- PostgreSQL database cluster dump
--

\restrict CZ12hgqIDRVOLQWhSlMaHAqtpM0JzdmID5NwCmOAxoUZ286bq273GArA3m9XAma

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE ads_service;
DROP DATABASE appointment_service;
DROP DATABASE doctor_service;
DROP DATABASE fayo;
DROP DATABASE hospital_service;
DROP DATABASE payment_service;
DROP DATABASE readme_to_recover;
DROP DATABASE specialty_service;
DROP DATABASE user_service;




--
-- Drop roles
--

DROP ROLE postgres;


--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:3xsFD6PLsC0bBvn9go3Kiw==$T8mFEu64leiiHk8luhBEjVHBrq24p5SbKO0rXfdtMgQ=:DzcYA19vJvWK2/5274VtTMBs8yznxyCUMatI66J0sTA=';

--
-- User Configurations
--








\unrestrict CZ12hgqIDRVOLQWhSlMaHAqtpM0JzdmID5NwCmOAxoUZ286bq273GArA3m9XAma

--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

\restrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO postgres;

\unrestrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI
\connect template1
\restrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\unrestrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI
\connect template1
\restrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: postgres
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict tmuAehvxwNEq7Pa79Tix2zghZCHNybk735YXyk7Uocs0Ttef7RKCHNLr1lJFECI

--
-- Database "appointment_service" dump
--

--
-- PostgreSQL database dump
--

\restrict WE9RKSbsWgpuVJ0ZHZQWYMQbQp3IRsPM8peUI4ho345nEFauc5jor4tq1CYAlls

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: appointment_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE appointment_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE appointment_service OWNER TO postgres;

\unrestrict WE9RKSbsWgpuVJ0ZHZQWYMQbQp3IRsPM8peUI4ho345nEFauc5jor4tq1CYAlls
\connect appointment_service
\restrict WE9RKSbsWgpuVJ0ZHZQWYMQbQp3IRsPM8peUI4ho345nEFauc5jor4tq1CYAlls

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: appointments; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA appointments;


ALTER SCHEMA appointments OWNER TO postgres;

--
-- Name: AppointmentStatus; Type: TYPE; Schema: appointments; Owner: postgres
--

CREATE TYPE appointments."AppointmentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'RESCHEDULED'
);


ALTER TYPE appointments."AppointmentStatus" OWNER TO postgres;

--
-- Name: ConsultationType; Type: TYPE; Schema: appointments; Owner: postgres
--

CREATE TYPE appointments."ConsultationType" AS ENUM (
    'IN_PERSON',
    'VIDEO',
    'PHONE'
);


ALTER TYPE appointments."ConsultationType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: appointments; Owner: postgres
--

CREATE TYPE appointments."PaymentStatus" AS ENUM (
    'PENDING',
    'PAID',
    'REFUNDED'
);


ALTER TYPE appointments."PaymentStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointments; Type: TABLE; Schema: appointments; Owner: postgres
--

CREATE TABLE appointments.appointments (
    id text NOT NULL,
    "appointmentNumber" integer,
    "patientId" text NOT NULL,
    "doctorId" text,
    "hospitalId" text,
    "specialtyId" text,
    "appointmentDate" timestamp(3) without time zone NOT NULL,
    "appointmentTime" text NOT NULL,
    duration integer DEFAULT 30 NOT NULL,
    status appointments."AppointmentStatus" DEFAULT 'PENDING'::appointments."AppointmentStatus" NOT NULL,
    "consultationType" appointments."ConsultationType" DEFAULT 'IN_PERSON'::appointments."ConsultationType" NOT NULL,
    reason text,
    description text,
    "consultationFee" integer NOT NULL,
    "paymentStatus" appointments."PaymentStatus" DEFAULT 'PENDING'::appointments."PaymentStatus" NOT NULL,
    "paymentMethod" text,
    "paymentTransactionId" text,
    "createdBy" text NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelledBy" text,
    "cancellationReason" text,
    "completedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE appointments.appointments OWNER TO postgres;

--
-- Data for Name: appointments; Type: TABLE DATA; Schema: appointments; Owner: postgres
--

COPY appointments.appointments (id, "appointmentNumber", "patientId", "doctorId", "hospitalId", "specialtyId", "appointmentDate", "appointmentTime", duration, status, "consultationType", reason, description, "consultationFee", "paymentStatus", "paymentMethod", "paymentTransactionId", "createdBy", "cancelledAt", "cancelledBy", "cancellationReason", "completedAt", notes, "createdAt", "updatedAt") FROM stdin;
cmijmez130001p684fd2nqpag       1       cmijmeckt00029o6ou86w27ut       cmijmctfk0000d2qgy124c360       \N      \N      2025-12-01 11:00:00     11:00   30      PENDING IN_PERSON       \N  \N       1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-29 01:36:39.64  2025-11-29 01:36:39.64
cmijmfb7b0003p6847mc1j4kz       2       cmijmeckt00029o6ou86w27ut       cmijmctfk0000d2qgy124c360       \N      \N      2025-12-03 16:00:00     16:00   30      PENDING PHONE   \N      \N  1200     PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-29 01:36:55.416 2025-11-29 01:36:55.416
cmijmk5rq0007p6844qunifah       4       cmijmisiv00049o6ocunznfrx       cmijmctfk0000d2qgy124c360       \N      \N      2025-12-05 16:00:00     16:00   30      PENDING IN_PERSON       \N  \N       1200    PENDING \N      \N      +252907996021   \N      \N      \N      \N      \N      2025-11-29 01:40:41.655 2025-11-29 01:40:41.655
cmijo5o1200017hgjea0v5jyx       5       cmijmisiv00049o6ocunznfrx       cmijmctfk0000d2qgy124c360       \N      \N      2025-12-04 16:00:00     16:00   30      PENDING IN_PERSON       \N  \N       1200    PENDING \N      \N      +252907996021   \N      \N      \N      \N      \N      2025-11-29 02:25:24.71  2025-11-29 02:25:24.71
cmijmj9gp0005p684t8wz0dpi       3       cmijmisiv00049o6ocunznfrx       cmijmctfk0000d2qgy124c360       \N      \N      2025-11-30 19:30:00     19:30   30      COMPLETED       IN_PERSON   \N       \N      1200    PAID    CASH    004     +252907996021   \N      \N      \N      2025-11-29 02:26:06.976 \N      2025-11-29 01:39:59.785 2025-11-29 02:26:06.977
cmik8xymw00037hgjj7909ogs       6       cmijmisiv00049o6ocunznfrx       cmijmctfk0000d2qgy124c360       \N      \N      2025-12-05 20:30:00     20:30   30      PENDING IN_PERSON       \N  \N       1200    PENDING \N      \N      +252907996021   \N      \N      \N      \N      \N      2025-11-29 12:07:17.145 2025-11-29 12:07:17.145
cmiliz8pi0001k70l85i75wxh       7       cmiliz79f0000dlrk6tq4kxqc       cmijmctfk0000d2qgy124c360       cmijmbbro0001t09y91f7pxtr       \N      2025-12-05 06:00:00     06:00   30      CONFIRMED    IN_PERSON       waxba ima hayaan        wareeeg 1600    PAID    CASH    005     ADMIN   \N      \N      \N      \N      \N      2025-11-30 09:35:59.19  2025-11-30 09:36:34.299
cmiljzofl000159c169aoqb3a       8       cmiljzmvf0000frsdz2d5wngc       cmijmctfk0000d2qgy124c360       cmijmbbro0001t09y91f7pxtr       \N      2025-12-03 17:00:00     17:00   30      PENDING      IN_PERSON       \N      \N      0       PENDING \N      \N      ADMIN   \N      \N      \N      \N      \N      2025-11-30 10:04:19.185 2025-11-30 10:18:21.253
cmilktnqn0001l4mzri879qqy       9       cmilktmbl00001073k88q3f54       cmijmctfk0000d2qgy124c360       \N      \N      2025-11-30 10:30:00     10:30   30      CONFIRMED       IN_PERSON   \N       \N      1200    PAID    CASH    006     ADMIN   \N      \N      \N      \N      \N      2025-11-30 10:27:37.967 2025-11-30 10:41:08.26
cmilqszgp0006l4mzprspkrho       11      cmilqsx4d00051073f9sl3en9       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-02 10:00:00     10:00   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      ADMIN   \N      \N      \N      \N      \N      2025-11-30 13:15:04.201 2025-11-30 13:15:04.201
cmilqt3oc0008l4mz4iy9bieh       12      cmijmeckt00029o6ou86w27ut       \N      cmilqe6q80001meww8ik6j7vj       \N      2025-12-03 16:00:00     16:00   30      PENDING IN_PERSON       \N  \N       0       PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 13:15:09.661 2025-11-30 13:15:09.661
cmilr8qfc000al4mzxrnj5p9f       13      cmijmeckt00029o6ou86w27ut       \N      cmijmbbro0001t09y91f7pxtr       \N      2025-12-04 20:00:00     20:00   30      PENDING IN_PERSON       \N  \N       0       PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 13:27:18.984 2025-11-30 13:27:18.984
cmilsf4qm000cl4mzpuulqluh       14      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-03 16:00:00     16:00   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 14:00:17.086 2025-11-30 14:00:17.086
cmilq8uhc0004l4mzcekqyo5i       10      cmilq8r0k00011073dr78nuf9       cmilql39k0000shezoae4fr3x       cmijmbbro0001t09y91f7pxtr       \N      2025-12-01 08:30:00     08:30   45      PENDING      IN_PERSON       \N      \N      0       PENDING \N      \N      ADMIN   \N      \N      \N      \N      \N      2025-11-30 12:59:24.624 2025-11-30 14:29:11.654
cmilu4cqh00029653yx3hn1al       16      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-03 20:30:00     20:30   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 14:47:53.466 2025-11-30 14:47:53.466
cmiluc6ow00049653tezn1v94       17      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-05 19:30:00     19:30   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 14:53:58.878 2025-11-30 14:53:58.878
cmilutxhq00069653p8epxlvc       18      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-05 16:00:00     16:00   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 15:07:46.766 2025-11-30 15:07:46.766
cmilsgnhu000el4mzi2z426hg       15      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmijmbbro0001t09y91f7pxtr       \N      2025-12-03 14:30:00     14:30   30      PENDING      IN_PERSON       \N      \N      0       PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 14:01:28.05  2025-11-30 16:29:04.749
cmilxqz9r00025wsm4fyler0f       19      cmijmeckt00029o6ou86w27ut       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-05 20:00:00     20:00   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252907700949   \N      \N      \N      \N      \N      2025-11-30 16:29:27.951 2025-11-30 16:29:27.951
cmily17ca00045wsmtaxy4z6y       20      cmijmeckt00029o6ou86w27ut       cmilu6i3a0000m8130rdbkd0e       cmilqe6q80001meww8ik6j7vj       \N      2025-12-05 20:30:00     20:30   30      CONFIRMED    IN_PERSON       \N      \N      800     PAID    CASH    007     +252907700949   \N      \N      \N      \N      \N      2025-11-30 16:37:24.971 2025-11-30 16:37:41.655
cmilygow900065wsmrewc3i6j       21      cmilucebu000113ui5f47ynzm       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       \N      2025-12-02 11:00:00     11:00   30      PENDING      IN_PERSON       \N      \N      1200    PENDING \N      \N      +252905293355   \N      \N      \N      \N      \N      2025-11-30 16:49:27.561 2025-11-30 16:49:27.561
\.


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: appointments; Owner: postgres
--

ALTER TABLE ONLY appointments.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: appointments_appointmentDate_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_appointmentDate_idx" ON appointments.appointments USING btree ("appointmentDate");


--
-- Name: appointments_appointmentNumber_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_appointmentNumber_idx" ON appointments.appointments USING btree ("appointmentNumber");


--
-- Name: appointments_appointmentNumber_key; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE UNIQUE INDEX "appointments_appointmentNumber_key" ON appointments.appointments USING btree ("appointmentNumber") WHERE ("appointmentNumber" IS NOT NULL);


--
-- Name: appointments_doctorId_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_doctorId_idx" ON appointments.appointments USING btree ("doctorId");


--
-- Name: appointments_hospitalId_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_hospitalId_idx" ON appointments.appointments USING btree ("hospitalId");


--
-- Name: appointments_patientId_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_patientId_idx" ON appointments.appointments USING btree ("patientId");


--
-- Name: appointments_paymentStatus_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX "appointments_paymentStatus_idx" ON appointments.appointments USING btree ("paymentStatus");


--
-- Name: appointments_status_idx; Type: INDEX; Schema: appointments; Owner: postgres
--

CREATE INDEX appointments_status_idx ON appointments.appointments USING btree (status);


--
-- PostgreSQL database dump complete
--

\unrestrict WE9RKSbsWgpuVJ0ZHZQWYMQbQp3IRsPM8peUI4ho345nEFauc5jor4tq1CYAlls

--
-- Database "ads_service" dump
--

--
-- PostgreSQL database dump
--

\restrict adsSvcR3stR1ctK3yF0rAdsS3rv1c3Dump2024

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ads_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE ads_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE ads_service OWNER TO postgres;

\unrestrict adsSvcR3stR1ctK3yF0rAdsS3rv1c3Dump2024
\connect ads_service
\restrict adsSvcR3stR1ctK3yF0rAdsS3rv1c3Dump2024

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ads; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA ads;


ALTER SCHEMA ads OWNER TO postgres;

--
-- Name: AdStatus; Type: TYPE; Schema: ads; Owner: postgres
--

CREATE TYPE ads."AdStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'EXPIRED'
);


ALTER TYPE ads."AdStatus" OWNER TO postgres;

--
-- Name: AdType; Type: TYPE; Schema: ads; Owner: postgres
--

CREATE TYPE ads."AdType" AS ENUM (
    'BANNER',
    'CAROUSEL',
    'INTERSTITIAL'
);


ALTER TYPE ads."AdType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ads; Type: TABLE; Schema: ads; Owner: postgres
--

CREATE TABLE ads.ads (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "imageUrl" text NOT NULL,
    "linkUrl" text,
    type ads."AdType" DEFAULT 'BANNER'::ads."AdType" NOT NULL,
    status ads."AdStatus" DEFAULT 'PENDING'::ads."AdStatus" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "clickCount" integer DEFAULT 0 NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "createdBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE ads.ads OWNER TO postgres;

--
-- Data for Name: ads; Type: TABLE DATA; Schema: ads; Owner: postgres
--

COPY ads.ads (id, title, description, "imageUrl", "linkUrl", type, status, "startDate", "endDate", priority, "clickCount", "viewCount", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.

--
-- Name: ads ads_pkey; Type: CONSTRAINT; Schema: ads; Owner: postgres
--

ALTER TABLE ONLY ads.ads
    ADD CONSTRAINT ads_pkey PRIMARY KEY (id);


--
-- Name: idx_ads_priority_status; Type: INDEX; Schema: ads; Owner: postgres
--

CREATE INDEX idx_ads_priority_status ON ads.ads USING btree (priority DESC, status);


--
-- Name: idx_ads_status_dates; Type: INDEX; Schema: ads; Owner: postgres
--

CREATE INDEX idx_ads_status_dates ON ads.ads USING btree (status, "startDate", "endDate");


--
-- Name: SCHEMA ads; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA ads IS 'Schema for advertisements management';


--
-- Name: TABLE ads.ads; Type: COMMENT; Schema: ads; Owner: postgres
--

COMMENT ON TABLE ads.ads IS 'Stores advertisement information';


--
-- Name: COLUMN ads.ads.priority; Type: COMMENT; Schema: ads; Owner: postgres
--

COMMENT ON COLUMN ads.ads.priority IS 'Higher priority ads are shown first';


--
-- Name: COLUMN ads.ads."clickCount"; Type: COMMENT; Schema: ads; Owner: postgres
--

COMMENT ON COLUMN ads.ads."clickCount" IS 'Number of times the ad was clicked';


--
-- Name: COLUMN ads.ads."viewCount"; Type: COMMENT; Schema: ads; Owner: postgres
--

COMMENT ON COLUMN ads.ads."viewCount" IS 'Number of times the ad was viewed';


--
-- PostgreSQL database dump complete
--

\unrestrict adsSvcR3stR1ctK3yF0rAdsS3rv1c3Dump2024

--
-- Database "doctor_service" dump
--

--
-- PostgreSQL database dump
--

\restrict aDT37O5jD5hNUjV6EMYbeeqsuuyI2Ae2Dzb55syj5ph9BYa3kP5i0sZOoaiS9yL

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: doctor_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE doctor_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE doctor_service OWNER TO postgres;

\unrestrict aDT37O5jD5hNUjV6EMYbeeqsuuyI2Ae2Dzb55syj5ph9BYa3kP5i0sZOoaiS9yL
\connect doctor_service
\restrict aDT37O5jD5hNUjV6EMYbeeqsuuyI2Ae2Dzb55syj5ph9BYa3kP5i0sZOoaiS9yL

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: doctor_specialties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_specialties (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "specialtyId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.doctor_specialties OWNER TO postgres;

--
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    id text NOT NULL,
    "userId" text NOT NULL,
    "licenseNumber" text NOT NULL,
    experience integer NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "consultationFee" integer,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "selfEmployedConsultationFee" integer,
    education text,
    certifications text,
    languages text,
    awards text,
    publications text,
    memberships text,
    "researchInterests" text,
    "imageUrl" text
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- Name: hospital_doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospital_doctors (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "hospitalId" text NOT NULL,
    role text DEFAULT 'CONSULTANT'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leftAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hospital_doctors OWNER TO postgres;

--
-- Name: hospitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hospitals (
    id text NOT NULL,
    name text NOT NULL,
    type text DEFAULT 'HOSPITAL'::text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    phone text,
    email text,
    website text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.hospitals OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ddde05be-f141-4664-b8f2-6c4054b6ca7c    d02e177ba52ff9f0ffc04a4b1ce25f1dff581f86d2aa56e5e70a702e34991a1a        2025-11-29 01:06:55.853613+00   20251115212103_init     \N      \N      2025-11-29 01:06:55.832839+00        1
\.


--
-- Data for Name: doctor_specialties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_specialties (id, "doctorId", "specialtyId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmijmctfk0001d2qgbm0odovm       cmijmctfk0000d2qgy124c360       cmijm9cci0000t9fgmghp33i1       t       2025-11-29 01:34:59.072 2025-11-29 01:34:59.072
cmilqm7yr0002shez48e29wjt       cmilql39k0000shezoae4fr3x       cmijm9cci0000t9fgmghp33i1       t       2025-11-30 13:09:48.627 2025-11-30 13:09:48.627
cmilxrnfc0000zvglmplq2hxz       cmilu6i3a0000m8130rdbkd0e       cmijm9cci0000t9fgmghp33i1       t       2025-11-30 16:29:59.256 2025-11-30 16:29:59.256
cmilxt3l80002zvgliexu5pli       cmilxt3l80001zvglifsskzpg       cmijm9cci0000t9fgmghp33i1       t       2025-11-30 16:31:06.86  2025-11-30 16:31:06.86
cmilyodli0004zvgly3b7m71r       cmilyodlh0003zvglof5a3zr2       cmijm9cci0000t9fgmghp33i1       t       2025-11-30 16:55:26.071 2025-11-30 16:55:26.071
\.


--
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (id, "userId", "licenseNumber", experience, "isVerified", "isAvailable", "consultationFee", bio, "createdAt", "updatedAt", "selfEmployedConsultationFee", education, certifications, languages, awards, publications, memberships, "researchInterests", "imageUrl") FROM stdin;
cmijmctfk0000d2qgy124c360       cmijmct2l00019o6oktxdwq4p       Esse hic placeat e      47      f       t       \N      Dolore veritatis lib    2025-11-29 01:34:59.072 2025-11-29 01:34:59.072      1200    Inventore praesentiu    ["Consequatur maiores"] ["Sed mollit at non re"]        ["Hic id sapiente volu"]        ["Explicabo Eu non se"] ["Laborum non maxime c"]        Quia eaque rerum vit \N
cmilql39k0000shezoae4fr3x       cmilql2b400031073pwykns1j       765745  10      f       t       \N      dhaqtar guud    2025-11-30 13:08:55.88  2025-11-30 13:09:48.627 \N      mmm hh jj   \N       ["english","arabic","somali"]   \N      \N      ["ssdf"]        \N      \N
cmilu6i3a0000m8130rdbkd0e       cmilu6hm6000013uiv44wp8la       MAD89789789     23      f       t       \N      \N      2025-11-30 14:49:33.718 2025-11-30 16:29:59.256 3400    \N      \N  \N       \N      \N      \N      \N      \N
cmilxt3l80001zvglifsskzpg       cmilxt34900005yv7kd9xprpn       Dolorem rem veniam      30      f       t       \N      Nobis voluptatum min    2025-11-30 16:31:06.86  2025-11-30 16:31:06.86       \N      \N      \N      \N      \N      \N      \N      \N      \N
cmilyodlh0003zvglof5a3zr2       cmilyoctk00035yv7nax650hs       231444  10      f       t       \N      \N      2025-11-30 16:55:26.071 2025-11-30 16:55:26.071 2000    \N      \N      \N  \N       \N      \N      \N      \N
\.


--
-- Data for Name: hospital_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospital_doctors (id, "doctorId", "hospitalId", role, "isActive", "joinedAt", "leftAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hospitals (id, name, type, address, city, phone, email, website, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: doctor_specialties doctor_specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_specialties
    ADD CONSTRAINT doctor_specialties_pkey PRIMARY KEY (id);


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: hospital_doctors hospital_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_doctors
    ADD CONSTRAINT hospital_doctors_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: doctor_specialties_doctorId_specialtyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "doctor_specialties_doctorId_specialtyId_key" ON public.doctor_specialties USING btree ("doctorId", "specialtyId");


--
-- Name: doctors_licenseNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON public.doctors USING btree ("licenseNumber");


--
-- Name: doctors_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "doctors_userId_key" ON public.doctors USING btree ("userId");


--
-- Name: hospital_doctors_doctorId_hospitalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "hospital_doctors_doctorId_hospitalId_key" ON public.hospital_doctors USING btree ("doctorId", "hospitalId");


--
-- Name: doctor_specialties doctor_specialties_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_specialties
    ADD CONSTRAINT "doctor_specialties_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hospital_doctors hospital_doctors_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_doctors
    ADD CONSTRAINT "hospital_doctors_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public.doctors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hospital_doctors hospital_doctors_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hospital_doctors
    ADD CONSTRAINT "hospital_doctors_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public.hospitals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict aDT37O5jD5hNUjV6EMYbeeqsuuyI2Ae2Dzb55syj5ph9BYa3kP5i0sZOoaiS9yL

--
-- Database "fayo" dump
--

--
-- PostgreSQL database dump
--

\restrict 3vatvM8JIaOTLNj0UO1PasFKaye689NxtppaPMT5itvwYuciCm2hZhDd6wiEEtD

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fayo; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE fayo WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE fayo OWNER TO postgres;

\unrestrict 3vatvM8JIaOTLNj0UO1PasFKaye689NxtppaPMT5itvwYuciCm2hZhDd6wiEEtD
\connect fayo
\restrict 3vatvM8JIaOTLNj0UO1PasFKaye689NxtppaPMT5itvwYuciCm2hZhDd6wiEEtD

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: payments; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA payments;


ALTER SCHEMA payments OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: payments; Owner: postgres
--

CREATE TYPE payments."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'BANK_TRANSFER',
    'MOBILE_MONEY',
    'CHEQUE',
    'OTHER'
);


ALTER TYPE payments."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: payments; Owner: postgres
--

CREATE TYPE payments."PaymentStatus" AS ENUM (
    'PAID',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE payments."PaymentStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: payments; Type: TABLE; Schema: payments; Owner: postgres
--

CREATE TABLE payments.payments (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "paymentMethod" payments."PaymentMethod" NOT NULL,
    "paymentStatus" payments."PaymentStatus" DEFAULT 'PAID'::payments."PaymentStatus" NOT NULL,
    "transactionId" text,
    "receiptNumber" text,
    "paidBy" text,
    "processedBy" text,
    notes text,
    "paymentDate" timestamp(3) without time zone,
    "processedAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "refundReason" text,
    "refundedBy" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE payments.payments OWNER TO postgres;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: payments; Owner: postgres
--

COPY payments.payments (id, "appointmentId", amount, currency, "paymentMethod", "paymentStatus", "transactionId", "receiptNumber", "paidBy", "processedBy", notes, "paymentDate", "processedAt", "refundedAt", "refundReason", "refundedBy", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: payments; Owner: postgres
--

ALTER TABLE ONLY payments.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments_appointmentId_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_appointmentId_idx" ON payments.payments USING btree ("appointmentId");


--
-- Name: payments_paidBy_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paidBy_idx" ON payments.payments USING btree ("paidBy");


--
-- Name: payments_paymentDate_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentDate_idx" ON payments.payments USING btree ("paymentDate");


--
-- Name: payments_paymentMethod_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentMethod_idx" ON payments.payments USING btree ("paymentMethod");


--
-- Name: payments_paymentStatus_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentStatus_idx" ON payments.payments USING btree ("paymentStatus");


--
-- Name: payments_processedBy_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_processedBy_idx" ON payments.payments USING btree ("processedBy");


--
-- Name: payments_receiptNumber_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_receiptNumber_idx" ON payments.payments USING btree ("receiptNumber");


--
-- Name: payments_receiptNumber_key; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE UNIQUE INDEX "payments_receiptNumber_key" ON payments.payments USING btree ("receiptNumber") WHERE ("receiptNumber" IS NOT NULL);


--
-- Name: payments_transactionId_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_transactionId_idx" ON payments.payments USING btree ("transactionId");


--
-- Name: payments_transactionId_key; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE UNIQUE INDEX "payments_transactionId_key" ON payments.payments USING btree ("transactionId") WHERE ("transactionId" IS NOT NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict 3vatvM8JIaOTLNj0UO1PasFKaye689NxtppaPMT5itvwYuciCm2hZhDd6wiEEtD

--
-- Database "hospital_service" dump
--

--
-- PostgreSQL database dump
--

\restrict CfH5dtUy69eCAkQ2g8yTfKcM2LwSCvYNeUmZwvdNULPOXa3FTApfhgmuTYJNEKy

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hospital_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE hospital_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE hospital_service OWNER TO postgres;

\unrestrict CfH5dtUy69eCAkQ2g8yTfKcM2LwSCvYNeUmZwvdNULPOXa3FTApfhgmuTYJNEKy
\connect hospital_service
\restrict CfH5dtUy69eCAkQ2g8yTfKcM2LwSCvYNeUmZwvdNULPOXa3FTApfhgmuTYJNEKy

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: hospitals; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA hospitals;


ALTER SCHEMA hospitals OWNER TO postgres;

--
-- Name: BookingPolicy; Type: TYPE; Schema: hospitals; Owner: postgres
--

CREATE TYPE hospitals."BookingPolicy" AS ENUM (
    'HOSPITAL_ASSIGNED',
    'DIRECT_DOCTOR'
);


ALTER TYPE hospitals."BookingPolicy" OWNER TO postgres;

--
-- Name: HospitalType; Type: TYPE; Schema: hospitals; Owner: postgres
--

CREATE TYPE hospitals."HospitalType" AS ENUM (
    'HOSPITAL',
    'CLINIC'
);


ALTER TYPE hospitals."HospitalType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: doctors; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.doctors (
    id text NOT NULL,
    "userId" text NOT NULL,
    specialty text NOT NULL,
    "licenseNumber" text NOT NULL,
    experience integer NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "consultationFee" integer,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE hospitals.doctors OWNER TO postgres;

--
-- Name: hospital_doctors; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.hospital_doctors (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "hospitalId" text NOT NULL,
    role text DEFAULT 'CONSULTANT'::text NOT NULL,
    shift text,
    "startTime" text,
    "endTime" text,
    "consultationFee" integer,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "leftAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE hospitals.hospital_doctors OWNER TO postgres;

--
-- Name: hospital_services; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.hospital_services (
    id text NOT NULL,
    "hospitalId" text NOT NULL,
    "serviceId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE hospitals.hospital_services OWNER TO postgres;

--
-- Name: hospital_specialties; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.hospital_specialties (
    id text NOT NULL,
    "hospitalId" text NOT NULL,
    "specialtyId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE hospitals.hospital_specialties OWNER TO postgres;

--
-- Name: hospitals; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.hospitals (
    id text NOT NULL,
    "userId" text,
    name text NOT NULL,
    type hospitals."HospitalType" DEFAULT 'HOSPITAL'::hospitals."HospitalType" NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    phone text,
    email text,
    website text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bookingPolicy" hospitals."BookingPolicy" DEFAULT 'DIRECT_DOCTOR'::hospitals."BookingPolicy" NOT NULL,
    "logoUrl" text
);


ALTER TABLE hospitals.hospitals OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: hospitals; Owner: postgres
--

CREATE TABLE hospitals.services (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE hospitals.services OWNER TO postgres;

--
-- Data for Name: doctors; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.doctors (id, "userId", specialty, "licenseNumber", experience, "isVerified", "isAvailable", "consultationFee", bio, "createdAt", "updatedAt") FROM stdin;
cmijmctfk0000d2qgy124c360       cmijmct2l00019o6oktxdwq4p       Pediatric       Esse hic placeat e      47      f       t       \N      \N      2025-11-29 01:35:45.128 2025-11-29 01:35:45.128
cmilql39k0000shezoae4fr3x       cmilql2b400031073pwykns1j       Pediatric       765745  10      f       t       \N      \N      2025-11-30 13:12:18.107 2025-11-30 13:12:18.107
cmilu6i3a0000m8130rdbkd0e       cmilu6hm6000013uiv44wp8la       Pediatric       MAD89789789     23      f       t       \N      \N      2025-11-30 16:36:50.966 2025-11-30 16:36:50.966
\.


--
-- Data for Name: hospital_doctors; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.hospital_doctors (id, "doctorId", "hospitalId", role, shift, "startTime", "endTime", "consultationFee", status, "joinedAt", "leftAt", "createdAt", "updatedAt") FROM stdin;
cmilgc3m30001kna5m2sanquz       cmijmctfk0000d2qgy124c360       cmijmbbro0001t09y91f7pxtr       CONSULTANT      FULL_DAY        06:00   22:00   1600    ACTIVE  2025-11-30 08:22:00.264 \N  2025-11-30 08:22:00.264  2025-11-30 08:22:00.264
cmilqpfb50003mewwlidc29re       cmilql39k0000shezoae4fr3x       cmilqe6q80001meww8ik6j7vj       CONSULTANT      FULL_DAY        06:00   23:59   1200    ACTIVE  2025-11-30 13:12:18.113 \N  2025-11-30 13:12:18.113  2025-11-30 13:12:18.113
cmily0h3v0001jgkyo6rlsfs8       cmilu6i3a0000m8130rdbkd0e       cmilqe6q80001meww8ik6j7vj       CONSULTANT      FULL_DAY        10:00   00:00   800     ACTIVE  2025-11-30 16:36:50.97  \N  2025-11-30 16:36:50.97   2025-11-30 16:36:50.97
\.


--
-- Data for Name: hospital_services; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.hospital_services (id, "hospitalId", "serviceId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: hospital_specialties; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.hospital_specialties (id, "hospitalId", "specialtyId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: hospitals; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.hospitals (id, "userId", name, type, address, city, phone, email, website, "isActive", "createdAt", "updatedAt", "bookingPolicy", "logoUrl") FROM stdin;
cmijmbbro0001t09y91f7pxtr       cmijmbbhv00009o6omoavqeyx       Qaran Hospital  HOSPITAL        Siinaay Garowe  +252907796633   buryar313@gmail.com     https://qaran.so        t       2025-11-29 01:33:49.524      2025-11-30 09:46:49.485 HOSPITAL_ASSIGNED       \N
cmiliwl1d0001y7enbnh2pfku       cmijmisiv00049o6ocunznfrx       Yashfiin Hospital       HOSPITAL        Main Street     Garowe  +252907996021   yashfiin@gmail.com      https://www.yashfiin.com     t       2025-11-30 09:33:55.201 2025-11-30 10:19:05.685 DIRECT_DOCTOR   \N
cmilqe6q80001meww8ik6j7vj       cmilqe6ae000210737of2unqn       caraafat        HOSPITAL        garowe jidka guureye    Garowe  +252907794538   mohamed!1@gmail.com     \N      t       2025-11-30 13:03:33.777      2025-11-30 14:24:41.1   DIRECT_DOCTOR   \N
cmily390r0003jgky7o44nf5a       cmily38n800015yv7j11m00ju       Alias rem quia proid    HOSPITAL        Aperiam est harum l             +1 (216) 199-1713       wywogubyva@mailinator.com   https://www.pyxit.cm     t       2025-11-30 16:39:00.46  2025-11-30 16:39:00.46  DIRECT_DOCTOR   http://31.97.58.62:3002/uploads/3261eca3-6272-4058-8133-18a389611fc1.jpg
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: hospitals; Owner: postgres
--

COPY hospitals.services (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);


--
-- Name: hospital_doctors hospital_doctors_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.hospital_doctors
    ADD CONSTRAINT hospital_doctors_pkey PRIMARY KEY (id);


--
-- Name: hospital_services hospital_services_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.hospital_services
    ADD CONSTRAINT hospital_services_pkey PRIMARY KEY (id);


--
-- Name: hospital_specialties hospital_specialties_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.hospital_specialties
    ADD CONSTRAINT hospital_specialties_pkey PRIMARY KEY (id);


--
-- Name: hospitals hospitals_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.hospitals
    ADD CONSTRAINT hospitals_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: hospitals; Owner: postgres
--

ALTER TABLE ONLY hospitals.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: doctors_licenseNumber_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON hospitals.doctors USING btree ("licenseNumber");


--
-- Name: doctors_userId_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "doctors_userId_key" ON hospitals.doctors USING btree ("userId");


--
-- Name: hospital_doctors_doctorId_hospitalId_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "hospital_doctors_doctorId_hospitalId_key" ON hospitals.hospital_doctors USING btree ("doctorId", "hospitalId");


--
-- Name: hospital_services_hospitalId_serviceId_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "hospital_services_hospitalId_serviceId_key" ON hospitals.hospital_services USING btree ("hospitalId", "serviceId");


--
-- Name: hospital_specialties_hospitalId_specialtyId_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "hospital_specialties_hospitalId_specialtyId_key" ON hospitals.hospital_specialties USING btree ("hospitalId", "specialtyId");


--
-- Name: hospitals_userId_key; Type: INDEX; Schema: hospitals; Owner: postgres
--

CREATE UNIQUE INDEX "hospitals_userId_key" ON hospitals.hospitals USING btree ("userId") WHERE ("userId" IS NOT NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict CfH5dtUy69eCAkQ2g8yTfKcM2LwSCvYNeUmZwvdNULPOXa3FTApfhgmuTYJNEKy

--
-- Database "payment_service" dump
--

--
-- PostgreSQL database dump
--

\restrict aZsedvoCSY0JqbfJmgBR5RvVLF3in94sU3Mrxt4Z9JD8vNY7plBv9BBIsZEbYsK

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: payment_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE payment_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE payment_service OWNER TO postgres;

\unrestrict aZsedvoCSY0JqbfJmgBR5RvVLF3in94sU3Mrxt4Z9JD8vNY7plBv9BBIsZEbYsK
\connect payment_service
\restrict aZsedvoCSY0JqbfJmgBR5RvVLF3in94sU3Mrxt4Z9JD8vNY7plBv9BBIsZEbYsK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: payments; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA payments;


ALTER SCHEMA payments OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: payments; Owner: postgres
--

CREATE TYPE payments."PaymentMethod" AS ENUM (
    'CASH',
    'CARD',
    'BANK_TRANSFER',
    'MOBILE_MONEY',
    'CHEQUE',
    'OTHER'
);


ALTER TYPE payments."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: payments; Owner: postgres
--

CREATE TYPE payments."PaymentStatus" AS ENUM (
    'PAID',
    'REFUNDED',
    'CANCELLED'
);


ALTER TYPE payments."PaymentStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: payments; Type: TABLE; Schema: payments; Owner: postgres
--

CREATE TABLE payments.payments (
    id text NOT NULL,
    "appointmentId" text NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    "paymentMethod" payments."PaymentMethod" NOT NULL,
    "paymentStatus" payments."PaymentStatus" DEFAULT 'PAID'::payments."PaymentStatus" NOT NULL,
    "transactionId" text,
    "receiptNumber" text,
    "paidBy" text,
    "processedBy" text,
    notes text,
    "paymentDate" timestamp(3) without time zone,
    "processedAt" timestamp(3) without time zone,
    "refundedAt" timestamp(3) without time zone,
    "refundReason" text,
    "refundedBy" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE payments.payments OWNER TO postgres;

--
-- Data for Name: payments; Type: TABLE DATA; Schema: payments; Owner: postgres
--

COPY payments.payments (id, "appointmentId", amount, currency, "paymentMethod", "paymentStatus", "transactionId", "receiptNumber", "paidBy", "processedBy", notes, "paymentDate", "processedAt", "refundedAt", "refundReason", "refundedBy", metadata, "createdAt", "updatedAt") FROM stdin;
cmijmnbg40006e6ih5p8d1r7b       cmijmk5rq0007p6844qunifah       1200    USD     CASH    PAID    \N      001     +252907996021   cmij3gelv0000lk9iwzhmbqw1               \N      \N      \N  \N       \N      {}      2025-11-29 01:43:08.981 2025-11-29 01:43:08.981
cmijmo7870007e6ihvh12ftmb       cmijmj9gp0005p684t8wz0dpi       1200    USD     CASH    PAID    \N      002     +252907996021   cmij3gelv0000lk9iwzhmbqw1               \N      \N      \N  \N       \N      {}      2025-11-29 01:43:50.168 2025-11-29 01:43:50.168
cmijmoe3b0008e6ihqeq6j3lb       cmijmj9gp0005p684t8wz0dpi       1200    USD     MOBILE_MONEY    PAID    \N      003     +252907996021   cmij3gelv0000lk9iwzhmbqw1               \N      \N  \N       \N      \N      {}      2025-11-29 01:43:59.063 2025-11-29 01:43:59.063
cmijo4jch0000k3fgnnp2zqbd       cmijmj9gp0005p684t8wz0dpi       1200    USD     CASH    PAID    \N      004     +252907996021   cmij3gelv0000lk9iwzhmbqw1               \N      \N      \N  \N       \N      {}      2025-11-29 02:24:31.985 2025-11-29 02:24:31.985
cmilizze70000axocoayovau6       cmiliz8pi0001k70l85i75wxh       1600    USD     CASH    PAID    \N      005     +252907799292   cmij3gelv0000lk9iwzhmbqw1               \N      \N      \N  \N       \N      {}      2025-11-30 09:36:33.775 2025-11-30 09:36:33.775
cmillb0mf000011awgabutoun       cmilktnqn0001l4mzri879qqy       1200    USD     CASH    PAID    \N      006     +252907740453   admin-0001              \N      \N      \N      \N      \N  {}       2025-11-30 10:41:07.815 2025-11-30 10:41:07.815
cmily1jr30000zl9xcd6rjlqu       cmily17ca00045wsmtaxy4z6y       800     USD     CASH    PAID    \N      007     +252907700949   admin-0001              \N      \N      \N      \N      \N  {}       2025-11-30 16:37:41.055 2025-11-30 16:37:41.055
\.


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: payments; Owner: postgres
--

ALTER TABLE ONLY payments.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments_appointmentId_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_appointmentId_idx" ON payments.payments USING btree ("appointmentId");


--
-- Name: payments_paidBy_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paidBy_idx" ON payments.payments USING btree ("paidBy");


--
-- Name: payments_paymentDate_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentDate_idx" ON payments.payments USING btree ("paymentDate");


--
-- Name: payments_paymentMethod_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentMethod_idx" ON payments.payments USING btree ("paymentMethod");


--
-- Name: payments_paymentStatus_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_paymentStatus_idx" ON payments.payments USING btree ("paymentStatus");


--
-- Name: payments_processedBy_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_processedBy_idx" ON payments.payments USING btree ("processedBy");


--
-- Name: payments_receiptNumber_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_receiptNumber_idx" ON payments.payments USING btree ("receiptNumber");


--
-- Name: payments_receiptNumber_key; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE UNIQUE INDEX "payments_receiptNumber_key" ON payments.payments USING btree ("receiptNumber") WHERE ("receiptNumber" IS NOT NULL);


--
-- Name: payments_transactionId_idx; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE INDEX "payments_transactionId_idx" ON payments.payments USING btree ("transactionId");


--
-- Name: payments_transactionId_key; Type: INDEX; Schema: payments; Owner: postgres
--

CREATE UNIQUE INDEX "payments_transactionId_key" ON payments.payments USING btree ("transactionId") WHERE ("transactionId" IS NOT NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict aZsedvoCSY0JqbfJmgBR5RvVLF3in94sU3Mrxt4Z9JD8vNY7plBv9BBIsZEbYsK

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

\restrict Sjy4IuIj4AWBCG3CriJBIymQ0Wc2RgOltegA6EmiD7b8qqac0FPheSeALUle26s

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO postgres;

\unrestrict Sjy4IuIj4AWBCG3CriJBIymQ0Wc2RgOltegA6EmiD7b8qqac0FPheSeALUle26s
\connect postgres
\restrict Sjy4IuIj4AWBCG3CriJBIymQ0Wc2RgOltegA6EmiD7b8qqac0FPheSeALUle26s

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- PostgreSQL database dump complete
--

\unrestrict Sjy4IuIj4AWBCG3CriJBIymQ0Wc2RgOltegA6EmiD7b8qqac0FPheSeALUle26s

--
-- Database "readme_to_recover" dump
--

--
-- PostgreSQL database dump
--

\restrict G6d6LDrFfylXVhzDwwkpwiweAUM60EZpOqMaBVn1y4e6ErzyzPIuPfqPYGyBvOv

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: readme_to_recover; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE readme_to_recover WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE readme_to_recover OWNER TO postgres;

\unrestrict G6d6LDrFfylXVhzDwwkpwiweAUM60EZpOqMaBVn1y4e6ErzyzPIuPfqPYGyBvOv
\connect readme_to_recover
\restrict G6d6LDrFfylXVhzDwwkpwiweAUM60EZpOqMaBVn1y4e6ErzyzPIuPfqPYGyBvOv

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: readme; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.readme (
    text_field character varying(255)
);


ALTER TABLE public.readme OWNER TO postgres;

--
-- Data for Name: readme; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.readme (text_field) FROM stdin;
All your data is backed up. You must pay 0.0049 BTC to bc1qrun4ydtq8047u0kee03exsz642z99tvjcgygjm In 48 hours, your data will be publicly disclosed and deleted. (more information: go to http://2info.win/psg)
After paying send mail to us: rambler+3wmmu@onionmail.org and we will provide a link for you to download your data. Your DBCODE is: 3WMMU
\.


--
-- PostgreSQL database dump complete
--

\unrestrict G6d6LDrFfylXVhzDwwkpwiweAUM60EZpOqMaBVn1y4e6ErzyzPIuPfqPYGyBvOv

--
-- Database "specialty_service" dump
--

--
-- PostgreSQL database dump
--

\restrict xOR15gII2HAw5a1mfR9eFLLraU3oLloX7ib3gBDb1FwtFaAwETfwp5oSNenxeob

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: specialty_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE specialty_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE specialty_service OWNER TO postgres;

\unrestrict xOR15gII2HAw5a1mfR9eFLLraU3oLloX7ib3gBDb1FwtFaAwETfwp5oSNenxeob
\connect specialty_service
\restrict xOR15gII2HAw5a1mfR9eFLLraU3oLloX7ib3gBDb1FwtFaAwETfwp5oSNenxeob

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: specialties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialties (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.specialties OWNER TO postgres;

--
-- Data for Name: specialties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.specialties (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmijm9cci0000t9fgmghp33i1       Pediatric       \N      t       2025-11-29 01:32:16.963 2025-11-29 01:32:16.963
\.


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (id);


--
-- Name: specialties_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX specialties_name_key ON public.specialties USING btree (name);


--
-- PostgreSQL database dump complete
--

\unrestrict xOR15gII2HAw5a1mfR9eFLLraU3oLloX7ib3gBDb1FwtFaAwETfwp5oSNenxeob

--
-- Database "user_service" dump
--

--
-- PostgreSQL database dump
--

\restrict vw1x8NlppVMziPlW3LKk9TvX7VuWjjto8RLihtE2x6YH8arBcb5eSBZfnqT8MDh

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_service; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE user_service WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE user_service OWNER TO postgres;

\unrestrict vw1x8NlppVMziPlW3LKk9TvX7VuWjjto8RLihtE2x6YH8arBcb5eSBZfnqT8MDh
\connect user_service
\restrict vw1x8NlppVMziPlW3LKk9TvX7VuWjjto8RLihtE2x6YH8arBcb5eSBZfnqT8MDh

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: users; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA users;


ALTER SCHEMA users OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: users; Owner: postgres
--

CREATE TYPE users."Gender" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE users."Gender" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: users; Owner: postgres
--

CREATE TYPE users."UserRole" AS ENUM (
    'PATIENT',
    'DOCTOR',
    'ADMIN',
    'HOSPITAL',
    'CLINIC'
);


ALTER TYPE users."UserRole" OWNER TO postgres;

--
-- Name: UserType; Type: TYPE; Schema: users; Owner: postgres
--

CREATE TYPE users."UserType" AS ENUM (
    'PATIENT',
    'DOCTOR',
    'HOSPITAL_MANAGER'
);


ALTER TYPE users."UserType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: otp_codes; Type: TABLE; Schema: users; Owner: postgres
--

CREATE TABLE users.otp_codes (
    id text NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE users.otp_codes OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: users; Owner: postgres
--

CREATE TABLE users.users (
    id text NOT NULL,
    username text,
    email text,
    phone text,
    password text,
    "firstName" text,
    "lastName" text,
    role users."UserRole" DEFAULT 'PATIENT'::users."UserRole" NOT NULL,
    "userType" users."UserType" DEFAULT 'PATIENT'::users."UserType" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    gender users."Gender",
    address text
);


ALTER TABLE users.users OWNER TO postgres;

--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: users; Owner: postgres
--

COPY users.otp_codes (id, phone, code, "expiresAt", "isUsed", "createdAt") FROM stdin;
cmijmeckw00039o6o4187rdvf       +252907700949   509569  2025-11-29 01:41:10.544 t       2025-11-29 01:36:10.545
cmijmisiy00059o6or3bgotdn       +252907996021   380411  2025-11-29 01:44:37.834 t       2025-11-29 01:39:37.835
cmikvh6vq0000oou28q5rxxwl       +252907700949   332281  2025-11-29 22:43:05.844 t       2025-11-29 22:38:05.846
cmilqs8sc00041073q2uv5nzb       +252907700949   269850  2025-11-30 13:19:29.628 t       2025-11-30 13:14:29.628
cmilucec5000213ui1e8hdebh       +252905293355   459046  2025-11-30 14:59:08.788 f       2025-11-30 14:54:08.789
cmilwol420000jorfsluy6ips       +252905293355   906858  2025-11-30 16:04:36.671 f       2025-11-30 15:59:36.674
cmilye83000025yv7gkwelfiv       +252905293355   366764  2025-11-30 16:52:32.459 t       2025-11-30 16:47:32.46
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: users; Owner: postgres
--

COPY users.users (id, username, email, phone, password, "firstName", "lastName", role, "userType", "isActive", "createdAt", "updatedAt", "dateOfBirth", gender, address) FROM stdin;
admin-0001      0001    admin@fayo.com  \N      $2a$10$ZgIqzFeV9tKNOQ2lm5RGju6mK/tRVUO6XauNHDlDn72r17hNmn95S    System  Administrator   ADMIN   HOSPITAL_MANAGER        t       2025-11-29 01:31:53.986      2025-11-29 01:31:53.986 \N      \N      \N
cmijmbbhv00009o6omoavqeyx       0002    buryar313@gmail.com     +252907796633   $2a$10$SZw4c8Yo/53wwvHdiPxO3usllsVWOH.fefprnQ8LSQWhbzcKp0trq    Qaran Hospital  Garowe  HOSPITAL        HOSPITAL_MANAGER     t       2025-11-29 01:33:49.171 2025-11-29 01:33:49.171 \N      \N      \N
cmijmct2l00019o6oktxdwq4p       0003    mexebif@mailinator.com  +1 (213) 811-3065       $2a$10$XKdzFhOtH5Kx9erHMKvSfeuceMwt.9DOKDQUsgbL/SzV1iaRYUIGa    Provident aliquip a     Dolore ut architecto DOCTOR  DOCTOR  t       2025-11-29 01:34:58.606 2025-11-29 01:34:58.606 1970-01-23 00:00:00     MALE    Quidem reprehenderit
cmijmeckt00029o6ou86w27ut       \N      \N      +252907700949   \N      User    User    PATIENT PATIENT t       2025-11-29 01:36:10.542 2025-11-29 01:36:10.542 \N      \N      \N
cmijmisiv00049o6ocunznfrx       \N      \N      +252907996021   \N      User    User    PATIENT PATIENT t       2025-11-29 01:39:37.832 2025-11-29 01:39:37.832 \N      \N      \N
cmiliz79f0000dlrk6tq4kxqc       ahmedabdi       \N      +252907799292   $2a$10$djDCMiyBgKN94365QUSCh.ajJdZ4BmoFub0nBMmQB56WDSU6neWdq    ahmed   abdi    PATIENT PATIENT t       2025-11-30 09:35:57.315      2025-11-30 09:35:57.315 \N      \N      \N
cmiljzmvf0000frsdz2d5wngc       luqmanomarabdisalam     \N      +252905295533   $2a$10$rO3xVIpli/7Apm6rYI7Bxe8WvTzuvcdcWb.r.UaAdrOoWnsyoVO3C    Luqman  Omar Abdisalam  PATIENT PATIENT t   2025-11-30 10:04:17.163  2025-11-30 10:04:17.163 \N      \N      \N
cmilktmbl00001073k88q3f54       aliahmed        \N      +252907740453   $2a$10$8PhkioIgl19Npnd3qC6DQO9MFC2h/i90nY6ChGdjvfcEZdKHkyYci    Ali     ahmed   PATIENT PATIENT t       2025-11-30 10:27:36.13       2025-11-30 10:27:36.13  \N      \N      \N
cmilq8r0k00011073dr78nuf9       lukman  \N      0907794538      $2a$10$nk6TzlIcAlSQJyOSfuXFVOt/L31Cgkh4/FhVN10PcRYYDzjsiX.Ma    lukman          PATIENT PATIENT t       2025-11-30 12:59:20.132      2025-11-30 12:59:20.132 \N      \N      \N
cmilqe6ae000210737of2unqn       0004    mohamed!1@gmail.com     +252907794538   $2a$10$j4YkIPwfvSZajFMuGZWBBusvyyZFw0LiNzoBCUIsFScML8HyKLe4K    mohamed jama    HOSPITAL        HOSPITAL_MANAGER     t       2025-11-30 13:03:33.207 2025-11-30 13:03:33.207 \N      \N      \N
cmilql2b400031073pwykns1j       0005    ryan.taylor.cmilql@outlook.com  +1-555-3854     $2a$10$7DzpiiwBxy3JVhukgsi6R.kXCyQKQ.e2MXDE0Pl.f8UxiEu/77Guu    Bashir Ali      Biixi   DOCTOR  DOCTOR       t       2025-11-30 13:08:54.64  2025-11-30 13:09:48.435 1976-07-01 00:00:00     MALE    galkio siinay
cmilqsx4d00051073f9sl3en9       lukmanomer      \N      +252907554433   $2a$10$KlCx4WJ8nR67ogi6qwmWlemYW.Ix1mp5gs9/WV7A4ud9UErNoB45W    lukman  omer    PATIENT PATIENT t       2025-11-30 13:15:01.166      2025-11-30 13:15:01.166 \N      \N      \N
cmilucebu000113ui5f47ynzm       \N      \N      +252905293355   \N      User    User    PATIENT PATIENT t       2025-11-30 14:54:08.779 2025-11-30 14:54:08.779 \N      \N      \N
cmilu6hm6000013uiv44wp8la       0006    zaregej@mailinator.com  +25207709992    $2a$10$ohXQggwT3qgXESORjXW0G.D7uupKeC4hO1U.7mrsfOiJVG949eBtW    Abdi    Biixi   DOCTOR  DOCTOR  t       2025-11-30 14:49:33.103      2025-11-30 16:29:58.757 1965-05-28 00:00:00     MALE    Dolore mollitia inve
cmilxt34900005yv7kd9xprpn       0007    gixis@mailinator.com    +1 (544) 172-7821       $2a$10$q/4Oqc26lG3qRZgJdWNa9es4ac5M8akf0EHWOMfdz431Y6bptkjXK    Consequuntur aliquid    Expedita possimus v  DOCTOR  DOCTOR  t       2025-11-30 16:31:06.249 2025-11-30 16:31:06.249 1993-03-27 00:00:00     FEMALE  Sit id id dolores ac
cmily38n800015yv7j11m00ju       0008    wywogubyva@mailinator.com       +1 (216) 199-1713       $2a$10$r0jWWaWO9Z7Xt7jbJ0xffe24BW8wIVhjKtjcn1/8/4kocsiw/rSkK    Sed magnam praesenti    Sed eiusmod rerum ip HOSPITAL        HOSPITAL_MANAGER        t       2025-11-30 16:38:59.972 2025-11-30 16:38:59.972 \N      \N      \N
cmilyoctk00035yv7nax650hs       0009    dalab11@gmail.com       +252907666666   $2a$10$.VKqxAMRs5HS1/5pE2xyj.W.e.i/8wXGNnRRj0gtWKt1xtGyNfGRi    saadik  adam dalab      DOCTOR  DOCTOR  t   2025-11-30 16:55:25.161  2025-11-30 16:55:25.161 1980-02-29 00:00:00     MALE    galkio darawish
\.


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: users; Owner: postgres
--

ALTER TABLE ONLY users.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: users; Owner: postgres
--

ALTER TABLE ONLY users.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_email_key; Type: INDEX; Schema: users; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON users.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: users_phone_key; Type: INDEX; Schema: users; Owner: postgres
--

CREATE UNIQUE INDEX users_phone_key ON users.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: users_username_key; Type: INDEX; Schema: users; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON users.users USING btree (username) WHERE (username IS NOT NULL);


--
-- Name: users_username_unique; Type: INDEX; Schema: users; Owner: postgres
--

CREATE UNIQUE INDEX users_username_unique ON users.users USING btree (username) WHERE (username IS NOT NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict vw1x8NlppVMziPlW3LKk9TvX7VuWjjto8RLihtE2x6YH8arBcb5eSBZfnqT8MDh

--
-- PostgreSQL database cluster dump complete
--

