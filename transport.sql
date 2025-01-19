--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: auto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auto (
    id uuid NOT NULL,
    value character varying NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE public.auto OWNER TO postgres;

--
-- Name: cargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargo (
    id uuid NOT NULL,
    name character varying NOT NULL,
    size numeric NOT NULL
);


ALTER TABLE public.cargo OWNER TO postgres;

--
-- Name: destination; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.destination (
    id uuid NOT NULL,
    value character varying NOT NULL
);


ALTER TABLE public.destination OWNER TO postgres;

--
-- Name: voyage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.voyage (
    id uuid NOT NULL,
    destination uuid NOT NULL,
    auto uuid NOT NULL,
    cargos uuid[] DEFAULT '{}'::uuid[] NOT NULL
);


ALTER TABLE public.voyage OWNER TO postgres;

--
-- Data for Name: auto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auto (id, value, type) FROM stdin;
03e1302e-2557-46cb-b21f-c2c0c6016f09	Volvo	Фура
78b9ffa4-3b69-4017-b7ac-709629511671	Hyundai	Грузовик
13374676-baaa-44c3-9273-49a8a08715f7	Nissan	Фургон
\.


--
-- Data for Name: cargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cargo (id, name, size) FROM stdin;
\.


--
-- Data for Name: destination; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.destination (id, value) FROM stdin;
1839ed4e-2076-460a-bbd6-1fae57a4c476	52 Windler Fork
abb90fb1-ce87-4e1a-8184-1e7f51b96123	5 Lyla Alley
37d63b83-d570-495f-8e36-7cd425a27ebd	36 Lafayette Circles
ca90736c-05f3-4db1-b552-86740bd9d274	32 Bugs Gate
\.


--
-- Data for Name: voyage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.voyage (id, destination, auto, cargos) FROM stdin;
\.


--
-- Name: auto auto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto
    ADD CONSTRAINT auto_pkey PRIMARY KEY (id);


--
-- Name: cargo cargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargo
    ADD CONSTRAINT cargo_pkey PRIMARY KEY (id);


--
-- Name: destination destination_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destination
    ADD CONSTRAINT destination_pkey PRIMARY KEY (id);


--
-- Name: voyage voyage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyage
    ADD CONSTRAINT voyage_pkey PRIMARY KEY (id);


--
-- Name: voyage auto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyage
    ADD CONSTRAINT auto FOREIGN KEY (auto) REFERENCES public.auto(id);


--
-- Name: voyage destination; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.voyage
    ADD CONSTRAINT destination FOREIGN KEY (destination) REFERENCES public.destination(id);


--
-- PostgreSQL database dump complete
--

