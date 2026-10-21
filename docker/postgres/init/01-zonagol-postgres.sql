--
-- PostgreSQL database dump
--

\restrict ltne2ohqUIlvrxhyJNbUFvoVITXv3IOHvRIugp74tyltcx3uQEvfqs237FoYpgl

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: alineacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alineacion (
    alineacionid integer NOT NULL,
    partidoid integer NOT NULL,
    jugadorequipoid integer NOT NULL,
    posicionid integer NOT NULL,
    estitular boolean DEFAULT false NOT NULL,
    minutoingreso smallint,
    minutosalida smallint,
    CONSTRAINT ck_alineacion_minutos CHECK ((((minutoingreso IS NULL) OR (minutoingreso >= 0)) AND ((minutosalida IS NULL) OR (minutosalida >= 0)) AND ((minutoingreso IS NULL) OR (minutosalida IS NULL) OR (minutosalida >= minutoingreso))))
);


--
-- Name: calendario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario (
    temporadaid integer NOT NULL,
    numerojornada integer NOT NULL,
    codigocalendario character varying(50) GENERATED ALWAYS AS (((('CA'::text || (temporadaid)::text) || '-'::text) || (numerojornada)::text)) STORED,
    fechainicio date,
    fechafin date,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_calendario_fechas CHECK (((fechafin IS NULL) OR (fechainicio IS NULL) OR (fechafin >= fechainicio))),
    CONSTRAINT ck_calendario_numerojornada CHECK ((numerojornada > 0))
);


--
-- Name: configuracionregla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracionregla (
    configuracionreglaid integer NOT NULL,
    reglaid integer NOT NULL,
    parametro character varying(100) NOT NULL,
    valor character varying(100) NOT NULL,
    unidad character varying(30)
);


--
-- Name: deporte; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deporte (
    deporteid integer NOT NULL,
    codigodeporte character varying(22) GENERATED ALWAYS AS (('DP'::text || (deporteid)::text)) STORED,
    servicioid integer NOT NULL,
    nombre character varying(80) NOT NULL,
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo (
    equipoid integer NOT NULL,
    codigoequipo character varying(22) GENERATED ALWAYS AS (('EQ'::text || (equipoid)::text)) STORED,
    ligaid integer NOT NULL,
    nombre character varying(120) NOT NULL,
    nombrecorto character varying(60),
    sigla character varying(10),
    ciudad character varying(100),
    fechafundacion date,
    estado boolean DEFAULT true NOT NULL,
    logodriveid character varying(100)
);


--
-- Name: equipoestadio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipoestadio (
    equipoestadioid integer NOT NULL,
    equipoid integer NOT NULL,
    estadioid integer NOT NULL,
    fechadesde date NOT NULL,
    fechahasta date,
    esprincipal boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_equipoestadio_fechas CHECK (((fechahasta IS NULL) OR (fechahasta >= fechadesde)))
);


--
-- Name: estadio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estadio (
    estadioid integer NOT NULL,
    codigoestadio character varying(22) GENERATED ALWAYS AS (('ES'::text || (estadioid)::text)) STORED,
    nombre character varying(150) NOT NULL,
    ciudad character varying(100) NOT NULL,
    direccion character varying(200),
    capacidad integer,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_estadio_capacidad CHECK (((capacidad IS NULL) OR (capacidad > 0)))
);


--
-- Name: estadisticaequipopartido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estadisticaequipopartido (
    estadisticaequipopartidoid integer NOT NULL,
    partidoid integer NOT NULL,
    equipoid integer NOT NULL,
    tipoestadisticaid integer NOT NULL,
    valor numeric(18,2) NOT NULL,
    CONSTRAINT ck_estadisticaequipo_valor CHECK ((valor >= (0)::numeric))
);


--
-- Name: estadisticajugadorpartido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estadisticajugadorpartido (
    estadisticajugadorpartidoid integer NOT NULL,
    partidoid integer NOT NULL,
    jugadorequipoid integer NOT NULL,
    tipoestadisticaid integer NOT NULL,
    valor numeric(18,2) NOT NULL,
    CONSTRAINT ck_estadisticajugador_valor CHECK ((valor >= (0)::numeric))
);


--
-- Name: estadopartido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estadopartido (
    estadopartidoid integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(250)
);


--
-- Name: eventopartido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eventopartido (
    eventopartidoid bigint NOT NULL,
    partidoid integer NOT NULL,
    tipoeventopartidoid integer NOT NULL,
    equipoid integer NOT NULL,
    jugadorequipoid integer,
    minuto smallint NOT NULL,
    minutoadicional smallint,
    CONSTRAINT ck_eventopartido_minuto CHECK ((minuto >= 0)),
    CONSTRAINT ck_eventopartido_minutoadicional CHECK (((minutoadicional IS NULL) OR (minutoadicional >= 0)))
);


--
-- Name: eventopartido_eventopartidoid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.eventopartido ALTER COLUMN eventopartidoid ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.eventopartido_eventopartidoid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: identificadorexterno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.identificadorexterno (
    proveedor character varying(30) NOT NULL,
    tipoentidad character varying(20) NOT NULL,
    idexterno character varying(100) NOT NULL,
    ligaid integer,
    equipoid integer,
    estadioid integer,
    partidoid integer,
    fechavinculacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_identificadorexterno_tipo CHECK (((((tipoentidad)::text = 'LIGA'::text) AND (ligaid IS NOT NULL) AND (equipoid IS NULL) AND (estadioid IS NULL) AND (partidoid IS NULL)) OR (((tipoentidad)::text = 'EQUIPO'::text) AND (ligaid IS NULL) AND (equipoid IS NOT NULL) AND (estadioid IS NULL) AND (partidoid IS NULL)) OR (((tipoentidad)::text = 'ESTADIO'::text) AND (ligaid IS NULL) AND (equipoid IS NULL) AND (estadioid IS NOT NULL) AND (partidoid IS NULL)) OR (((tipoentidad)::text = 'PARTIDO'::text) AND (ligaid IS NULL) AND (equipoid IS NULL) AND (estadioid IS NULL) AND (partidoid IS NOT NULL))))
);


--
-- Name: jugador; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jugador (
    jugadorid integer NOT NULL,
    codigojugador character varying(22) GENERATED ALWAYS AS (('JU'::text || (jugadorid)::text)) STORED,
    posicionid integer NOT NULL,
    primernombre character varying(60) NOT NULL,
    segundonombre character varying(60),
    primerapellido character varying(60) NOT NULL,
    segundoapellido character varying(60),
    fechanacimiento date,
    nacionalidad character varying(80),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: jugadorequipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jugadorequipo (
    jugadorequipoid integer NOT NULL,
    jugadorid integer NOT NULL,
    equipoid integer NOT NULL,
    fechadesde date NOT NULL,
    fechahasta date,
    numerocamiseta smallint,
    CONSTRAINT ck_jugadorequipo_camiseta CHECK (((numerocamiseta IS NULL) OR ((numerocamiseta >= 1) AND (numerocamiseta <= 99)))),
    CONSTRAINT ck_jugadorequipo_fechas CHECK (((fechahasta IS NULL) OR (fechahasta >= fechadesde)))
);


--
-- Name: liga; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liga (
    ligaid integer NOT NULL,
    codigoliga character varying(22) GENERATED ALWAYS AS (('LG'::text || (ligaid)::text)) STORED,
    deporteid integer NOT NULL,
    nombre character varying(120) NOT NULL,
    pais character varying(80) NOT NULL,
    descripcion character varying(300),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: partido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partido (
    partidoid integer NOT NULL,
    codigopartido character varying(22) GENERATED ALWAYS AS (('PT'::text || (partidoid)::text)) STORED,
    temporadaid integer NOT NULL,
    numerojornada integer NOT NULL,
    equipolocalid integer NOT NULL,
    equipovisitanteid integer NOT NULL,
    estadioid integer NOT NULL,
    estadopartidoid integer NOT NULL,
    fechahorainicio timestamp without time zone NOT NULL,
    goleslocal smallint,
    golesvisitante smallint,
    CONSTRAINT ck_partido_equipos CHECK ((equipolocalid <> equipovisitanteid)),
    CONSTRAINT ck_partido_goleslocal CHECK (((goleslocal IS NULL) OR (goleslocal >= 0))),
    CONSTRAINT ck_partido_golesvisitante CHECK (((golesvisitante IS NULL) OR (golesvisitante >= 0)))
);


--
-- Name: partidoregla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.partidoregla (
    partidoreglaid integer NOT NULL,
    partidoid integer NOT NULL,
    reglaid integer NOT NULL,
    cuota numeric(10,4) NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_partidoregla_cuota CHECK ((cuota > (1)::numeric))
);


--
-- Name: posicion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posicion (
    posicionid integer NOT NULL,
    nombre character varying(60) NOT NULL,
    descripcion character varying(200),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: regla; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regla (
    reglaid integer NOT NULL,
    codigoregla character varying(22) GENERATED ALWAYS AS (('RG'::text || (reglaid)::text)) STORED,
    deporteid integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion character varying(400),
    tiporegla character varying(60) NOT NULL,
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: servicio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servicio (
    servicioid integer NOT NULL,
    codigoservicio character varying(22) GENERATED ALWAYS AS (('SV'::text || (servicioid)::text)) STORED,
    empresaid integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(300),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: temporada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temporada (
    temporadaid integer NOT NULL,
    codigotemporada character varying(22) GENERATED ALWAYS AS (('TP'::text || (temporadaid)::text)) STORED,
    ligaid integer NOT NULL,
    anio smallint NOT NULL,
    fechainicio date,
    fechafin date,
    estado boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_temporada_fechas CHECK (((fechafin IS NULL) OR (fechainicio IS NULL) OR (fechafin >= fechainicio)))
);


--
-- Name: tipoestadistica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipoestadistica (
    tipoestadisticaid integer NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad character varying(30),
    descripcion character varying(250),
    estado boolean DEFAULT true NOT NULL
);


--
-- Name: tipoeventopartido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipoeventopartido (
    tipoeventopartidoid integer NOT NULL,
    nombre character varying(80) NOT NULL,
    descripcion character varying(250),
    estado boolean DEFAULT true NOT NULL
);


--
-- Data for Name: alineacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alineacion (alineacionid, partidoid, jugadorequipoid, posicionid, estitular, minutoingreso, minutosalida) FROM stdin;
\.


--
-- Data for Name: calendario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendario (temporadaid, numerojornada, fechainicio, fechafin, estado) FROM stdin;
1	1	2026-09-26	2026-09-27	t
1	2	2026-09-30	2026-10-01	t
1	3	2026-10-04	2026-10-05	t
1	4	2026-10-08	2026-10-09	t
1	5	2026-10-12	2026-10-13	t
1	6	2026-10-16	2026-10-17	t
1	7	2026-10-20	2026-10-21	t
1	8	2026-10-24	2026-10-25	t
1	9	2026-10-28	2026-10-29	t
1	10	2026-11-01	2026-11-02	t
1	11	2026-11-05	2026-11-06	t
1	12	2026-11-09	2026-11-10	t
1	13	2026-11-13	2026-11-14	t
1	14	2026-11-17	2026-11-18	t
1	15	2026-11-21	2026-11-22	t
1	16	2026-11-25	2026-11-26	t
1	17	2026-11-29	2026-11-30	t
1	18	2026-12-03	2026-12-04	t
1	19	2026-12-07	2026-12-08	t
2	1	2024-01-19	2024-01-22	t
\.


--
-- Data for Name: configuracionregla; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.configuracionregla (configuracionreglaid, reglaid, parametro, valor, unidad) FROM stdin;
1	4	LINEA_GOLES	2.5	GOLES
2	4	OPERADOR	MAYOR	\N
3	5	LINEA_GOLES	2.5	GOLES
4	5	OPERADOR	MENOR	\N
\.


--
-- Data for Name: deporte; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deporte (deporteid, servicioid, nombre, estado) FROM stdin;
1	1	FÚTBOL	t
\.


--
-- Data for Name: equipo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipo (equipoid, ligaid, nombre, nombrecorto, sigla, ciudad, fechafundacion, estado, logodriveid) FROM stdin;
22	1	Patriotas	Patriotas	PAT	Tunja	\N	t	1gjh3BvzOtEi21D-hYznJu1nnaPDlRO3Y
21	1	Envigado	Envigado	ENV	Envigado	\N	t	1MlSKTPWIvTX8P5Q1VDYIn5-igz-4dnec
20	1	Junior F.C.	Junior	JUN	Barranquilla	\N	t	1qLUV4U9-p7ZAct6SaoqjuttfCGhDmaMs
19	1	Deportivo Pereira	Pereira	PER	Pereira	\N	t	1_oya44FJwFRCKGehtzmk60mBGrvLKeYU
18	1	Jaguares F.C.	Jaguares	JAG	Montería	\N	t	1-zTq72TxsVHDHR9vivEtiwue41MLuob2
17	1	Boyacá Chicó F.C.	Boyacá Chicó	BCH	Tunja	\N	t	1njYyMP7WpXLI8Ddc9Jau0METoshdLrJg
16	1	Alianza Valledupar F.C.	Alianza	ALI	Valledupar	\N	t	1RF8Y7S6c3a71yPVt8zveSShruKizIeaI
15	1	Deportivo Pasto	Pasto	PAS	Pasto	\N	t	1WHTRTRrpiwLzv2KYhiGvF43SKToAkwUK
14	1	Fortaleza	Fortaleza	FOR	Bogotá	\N	t	1i5sgjIJyHtRIytWcFXtl88OKMUklWdn-
13	1	Cúcuta Deportivo	Cúcuta	CUC	Cúcuta	\N	t	1DHn18tJDUZXjFwJoyta1vaOsUsWDSrRY
12	1	Internacional de Bogotá	Internacional	INT	Bogotá	\N	t	1QWLvYOXk0QSlsJecbdIFi0bxYg-QkKlM
11	1	Llaneros F.C.	Llaneros	LLA	Villavicencio	\N	t	1JaU932lFmY3eZ-FvujnFp8rXJHZpHeH3
10	1	Águilas Doradas	Águilas	AGU	Medellín	\N	t	1ZWCicN3_pgc5vg5zHwO-Ne-_UG3-6Hih
9	1	Once Caldas DAF	Once Caldas	ONC	Manizales	\N	t	1vT4OQAog3e2dlFb5Xso9H5co_be3FaYc
8	1	Atlético Bucaramanga	Bucaramanga	BUC	Bucaramanga	\N	t	1_vNVrDeDIgzOyUAcguipLtIxqQgsn6SQ
7	1	Deportivo Cali	Deportivo Cali	CAL	Cali	\N	t	1d1sMW9zNLI8M-oSUA2Vtt4ZlguQKPq81
6	1	Deportes Tolima	Tolima	TOL	Ibagué	\N	t	12jzLtR39pIu2-JRJzCe3V2Zzc43cSg1P
5	1	Independiente Medellín	Medellín	DIM	Medellín	\N	t	1_MjqZKnOhIAHSXQMUvZrlEPfqTt65c9_
4	1	Independiente Santa Fe	Santa Fe	SFE	Bogotá	\N	t	1zEs1Ct6pEcOIj7pTxXC5Uq7scH6fgxT2
3	1	América de Cali	América	AME	Cali	\N	t	11ZQ8VJ2kH1cLjfVLHkc5YuYDeuk45lfA
2	1	Millonarios F.C.	Millonarios	MIL	Bogotá	\N	t	11xFTeDsaSXT3T_eSuhyoUJ1z8niZQTmk
1	1	Atlético Nacional	Nacional	NAL	Medellín	\N	t	1oG4StL4EXxZmNncYkzOLgu8BWh0E_VK6
\.


--
-- Data for Name: equipoestadio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipoestadio (equipoestadioid, equipoid, estadioid, fechadesde, fechahasta, esprincipal) FROM stdin;
1	1	1	2026-01-01	\N	t
2	2	2	2026-01-01	\N	t
3	3	3	2026-01-01	\N	t
4	4	2	2026-01-01	\N	t
5	5	1	2026-01-01	\N	t
6	6	4	2026-01-01	\N	t
7	7	5	2026-01-01	\N	t
8	8	6	2026-01-01	\N	t
9	9	7	2026-01-01	\N	t
10	10	8	2026-01-01	\N	t
11	11	9	2026-01-01	\N	t
12	12	10	2026-01-01	\N	t
13	13	11	2026-01-01	\N	t
14	14	10	2026-01-01	\N	t
15	15	12	2026-01-01	\N	t
16	16	13	2026-01-01	\N	t
17	17	14	2026-01-01	\N	t
18	18	15	2026-01-01	\N	t
19	19	16	2026-01-01	\N	t
20	20	17	2026-01-01	\N	t
\.


--
-- Data for Name: estadio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estadio (estadioid, nombre, ciudad, direccion, capacidad, estado) FROM stdin;
21	Estadio Daniel Villa Zapata	Barrancabermeja	Estadio de Béisbol 26 de abril, Villa Olímpica	10400	t
4	Estadio Manuel Murillo Toro	Ibagué	Carrera 4A Bis Nº 34 - 60 con Calle 36	38000	t
8	Estadio Cincuentenario	Medellín	\N	\N	t
9	Estadio Bello Horizonte	Villavicencio	\N	\N	t
11	Estadio General Santander	Cúcuta	\N	\N	t
13	Estadio Armando Maestre Pavajeau	Valledupar	\N	\N	t
15	Estadio Jaraguay	Montería	\N	\N	t
17	Estadio Romelio Martínez	Barranquilla	\N	\N	t
22	Estadio Alberto Grisales	Rionegro, Antioquia	Route 45A	14000	t
23	Estadio Municipal de Cota	Cota	Camellon de Las Flores	4000	t
16	Estadio Hernán Ramírez Villegas	Pereira	Villa Olímpica Pereira	30297	t
2	Estadio Nemesio Camacho El Campín	Bogotá	Avenida N.Q.S Calle 57	39512	t
12	Estadio Departamental Libertad	Pasto	Carrera 8	27380	t
5	Estadio Deportivo Cali	Palmira	BN 25	52000	t
1	Estadio Atanasio Girardot	Medellín	Entre carreras 70 y 73 y las Calles 48 y 50	45943	t
19	Estadio Polideportivo Sur	Envigado	Carrera 48 No. 46 Sur 150	14000	t
6	Estadio Américo Montanini	Bucaramanga	Carrera 36 Nº 53-12, Cabecera del Llano	28000	t
14	Estadio La Independencia	Tunja	Villa Olímpica	25000	t
20	Estadio de Fútbol Jaraguay de Montería	Montería	\N	12000	t
10	Estadio Metropolitano de Techo	Bogotá	Tv 71D, Kennedy	10000	t
18	Estadio Metropolitano Roberto Meléndez	Barranquilla	Avenida Circunvalar	46788	t
7	Estadio Palogrande	Manizales	Carrera 24 # 64 - 00	42678	t
3	Estadio Olímpico Pascual Guerrero	Cali	Carrera 36 entre Calles 5 y 5B3	46400	t
\.


--
-- Data for Name: estadisticaequipopartido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estadisticaequipopartido (estadisticaequipopartidoid, partidoid, equipoid, tipoestadisticaid, valor) FROM stdin;
\.


--
-- Data for Name: estadisticajugadorpartido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estadisticajugadorpartido (estadisticajugadorpartidoid, partidoid, jugadorequipoid, tipoestadisticaid, valor) FROM stdin;
\.


--
-- Data for Name: estadopartido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estadopartido (estadopartidoid, nombre, descripcion) FROM stdin;
1	PROGRAMADO	El partido está programado y aún no ha comenzado
2	EN_CURSO	El partido se está disputando
3	FINALIZADO	El partido terminó normalmente
4	SUSPENDIDO	El partido fue suspendido temporalmente
5	CANCELADO	El partido fue cancelado
\.


--
-- Data for Name: eventopartido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eventopartido (eventopartidoid, partidoid, tipoeventopartidoid, equipoid, jugadorequipoid, minuto, minutoadicional) FROM stdin;
\.


--
-- Data for Name: identificadorexterno; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.identificadorexterno (proveedor, tipoentidad, idexterno, ligaid, equipoid, estadioid, partidoid, fechavinculacion, estado) FROM stdin;
API_FOOTBALL	LIGA	239	1	\N	\N	\N	2026-09-27 18:25:30.969002	t
API_FOOTBALL	EQUIPO	1137	\N	1	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1125	\N	2	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1138	\N	3	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1139	\N	4	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1128	\N	5	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1142	\N	6	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1127	\N	7	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1131	\N	8	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1136	\N	9	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1144	\N	10	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1134	\N	12	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1147	\N	14	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1126	\N	15	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1141	\N	16	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1132	\N	17	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1133	\N	18	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1462	\N	19	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1135	\N	20	\N	\N	2026-09-27 18:26:20.625188	t
API_FOOTBALL	EQUIPO	1129	\N	21	\N	\N	2026-09-27 18:33:46.617443	t
API_FOOTBALL	EQUIPO	1140	\N	22	\N	\N	2026-09-27 18:33:46.617443	t
API_FOOTBALL	ESTADIO	380	\N	\N	1	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	383	\N	\N	2	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	368	\N	\N	3	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	375	\N	\N	4	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	384	\N	\N	7	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	371	\N	\N	10	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	377	\N	\N	12	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	372	\N	\N	14	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	378	\N	\N	16	\N	2026-09-27 18:34:57.356382	t
API_FOOTBALL	ESTADIO	366	\N	\N	18	\N	2026-09-27 18:37:37.910333	t
API_FOOTBALL	ESTADIO	379	\N	\N	19	\N	2026-09-27 18:37:37.910333	t
API_FOOTBALL	PARTIDO	1153061	\N	\N	\N	191	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153062	\N	\N	\N	192	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153063	\N	\N	\N	193	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153064	\N	\N	\N	194	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153065	\N	\N	\N	195	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153066	\N	\N	\N	196	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153067	\N	\N	\N	197	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153068	\N	\N	\N	198	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153069	\N	\N	\N	199	2026-09-27 18:49:41.154183	t
API_FOOTBALL	PARTIDO	1153070	\N	\N	\N	200	2026-09-27 18:49:41.154183	t
API_FOOTBALL	ESTADIO	376	\N	\N	5	\N	2026-09-27 18:58:21.530948	t
API_FOOTBALL	ESTADIO	21805	\N	\N	6	\N	2026-09-27 18:58:21.530948	t
API_FOOTBALL	ESTADIO	1779	\N	\N	20	\N	2026-09-27 18:58:21.530948	t
API_FOOTBALL	ESTADIO	367	\N	\N	21	\N	2026-09-27 18:58:21.530948	t
API_FOOTBALL	ESTADIO	381	\N	\N	22	\N	2026-09-27 18:58:21.530948	t
API_FOOTBALL	ESTADIO	382	\N	\N	23	\N	2026-09-27 18:58:21.530948	t
\.


--
-- Data for Name: jugador; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jugador (jugadorid, posicionid, primernombre, segundonombre, primerapellido, segundoapellido, fechanacimiento, nacionalidad, estado) FROM stdin;
\.


--
-- Data for Name: jugadorequipo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jugadorequipo (jugadorequipoid, jugadorid, equipoid, fechadesde, fechahasta, numerocamiseta) FROM stdin;
\.


--
-- Data for Name: liga; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.liga (ligaid, deporteid, nombre, pais, descripcion, estado) FROM stdin;
1	1	Categoría Primera A	Colombia	Primera división del fútbol profesional colombiano	t
\.


--
-- Data for Name: partido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partido (partidoid, temporadaid, numerojornada, equipolocalid, equipovisitanteid, estadioid, estadopartidoid, fechahorainicio, goleslocal, golesvisitante) FROM stdin;
6	1	1	6	15	4	1	2026-09-27 15:30:00	\N	\N
7	1	1	7	14	5	1	2026-09-27 17:00:00	\N	\N
8	1	1	8	13	6	1	2026-09-27 18:00:00	\N	\N
9	1	1	9	12	7	1	2026-09-27 19:00:00	\N	\N
10	1	1	10	11	8	1	2026-09-27 20:30:00	\N	\N
11	1	2	19	1	16	1	2026-09-30 15:00:00	\N	\N
12	1	2	20	18	17	1	2026-09-30 17:00:00	\N	\N
13	1	2	17	2	14	1	2026-09-30 19:00:00	\N	\N
14	1	2	3	16	3	1	2026-09-30 20:30:00	\N	\N
15	1	2	15	4	12	1	2026-09-30 21:00:00	\N	\N
16	1	2	5	14	1	1	2026-10-01 15:00:00	\N	\N
17	1	2	13	6	11	1	2026-10-01 17:00:00	\N	\N
18	1	2	7	12	5	1	2026-10-01 19:00:00	\N	\N
19	1	2	11	8	9	1	2026-10-01 20:30:00	\N	\N
20	1	2	9	10	7	1	2026-10-01 21:00:00	\N	\N
21	1	3	1	18	1	1	2026-10-04 15:00:00	\N	\N
22	1	3	17	19	14	1	2026-10-04 17:00:00	\N	\N
23	1	3	20	16	17	1	2026-10-04 19:00:00	\N	\N
24	1	3	15	2	12	1	2026-10-04 20:30:00	\N	\N
25	1	3	3	14	3	1	2026-10-04 21:00:00	\N	\N
26	1	3	13	4	11	1	2026-10-05 15:00:00	\N	\N
27	1	3	5	12	1	1	2026-10-05 17:00:00	\N	\N
28	1	3	11	6	9	1	2026-10-05 19:00:00	\N	\N
29	1	3	7	10	5	1	2026-10-05 20:30:00	\N	\N
30	1	3	9	8	7	1	2026-10-05 21:00:00	\N	\N
31	1	4	17	1	14	1	2026-10-08 15:00:00	\N	\N
32	1	4	18	16	15	1	2026-10-08 17:00:00	\N	\N
33	1	4	15	19	12	1	2026-10-08 19:00:00	\N	\N
34	1	4	20	14	17	1	2026-10-08 20:30:00	\N	\N
35	1	4	13	2	11	1	2026-10-08 21:00:00	\N	\N
36	1	4	3	12	3	1	2026-10-09 15:00:00	\N	\N
37	1	4	11	4	9	1	2026-10-09 17:00:00	\N	\N
38	1	4	5	10	1	1	2026-10-09 19:00:00	\N	\N
39	1	4	9	6	7	1	2026-10-09 20:30:00	\N	\N
40	1	4	7	8	5	1	2026-10-09 21:00:00	\N	\N
41	1	5	1	16	1	1	2026-10-12 15:00:00	\N	\N
42	1	5	15	17	12	1	2026-10-12 17:00:00	\N	\N
43	1	5	18	14	15	1	2026-10-12 19:00:00	\N	\N
44	1	5	13	19	11	1	2026-10-12 20:30:00	\N	\N
45	1	5	20	12	17	1	2026-10-12 21:00:00	\N	\N
46	1	5	11	2	9	1	2026-10-13 15:00:00	\N	\N
47	1	5	3	10	3	1	2026-10-13 17:00:00	\N	\N
48	1	5	9	4	7	1	2026-10-13 19:00:00	\N	\N
49	1	5	5	8	1	1	2026-10-13 20:30:00	\N	\N
50	1	5	7	6	5	1	2026-10-13 21:00:00	\N	\N
51	1	6	15	1	12	1	2026-10-16 15:00:00	\N	\N
52	1	6	16	14	13	1	2026-10-16 17:00:00	\N	\N
53	1	6	13	17	11	1	2026-10-16 19:00:00	\N	\N
54	1	6	18	12	15	1	2026-10-16 20:30:00	\N	\N
55	1	6	11	19	9	1	2026-10-16 21:00:00	\N	\N
56	1	6	20	10	17	1	2026-10-17 15:00:00	\N	\N
57	1	6	9	2	7	1	2026-10-17 17:00:00	\N	\N
58	1	6	3	8	3	1	2026-10-17 19:00:00	\N	\N
59	1	6	7	4	5	1	2026-10-17 20:30:00	\N	\N
60	1	6	5	6	1	1	2026-10-17 21:00:00	\N	\N
61	1	7	1	14	1	1	2026-10-20 15:00:00	\N	\N
62	1	7	13	15	11	1	2026-10-20 17:00:00	\N	\N
63	1	7	16	12	13	1	2026-10-20 19:00:00	\N	\N
64	1	7	11	17	9	1	2026-10-20 20:30:00	\N	\N
65	1	7	18	10	15	1	2026-10-20 21:00:00	\N	\N
66	1	7	9	19	7	1	2026-10-21 15:00:00	\N	\N
67	1	7	20	8	17	1	2026-10-21 17:00:00	\N	\N
68	1	7	7	2	5	1	2026-10-21 19:00:00	\N	\N
69	1	7	3	6	3	1	2026-10-21 20:30:00	\N	\N
70	1	7	5	4	1	1	2026-10-21 21:00:00	\N	\N
71	1	8	13	1	11	1	2026-10-24 15:00:00	\N	\N
72	1	8	14	12	10	1	2026-10-24 17:00:00	\N	\N
73	1	8	11	15	9	1	2026-10-24 19:00:00	\N	\N
74	1	8	16	10	13	1	2026-10-24 20:30:00	\N	\N
75	1	8	9	17	7	1	2026-10-24 21:00:00	\N	\N
76	1	8	18	8	15	1	2026-10-25 15:00:00	\N	\N
77	1	8	7	19	5	1	2026-10-25 17:00:00	\N	\N
78	1	8	20	6	17	1	2026-10-25 19:00:00	\N	\N
79	1	8	5	2	1	1	2026-10-25 20:30:00	\N	\N
80	1	8	3	4	3	1	2026-10-25 21:00:00	\N	\N
81	1	9	1	12	1	1	2026-10-28 15:00:00	\N	\N
82	1	9	11	13	9	1	2026-10-28 17:00:00	\N	\N
83	1	9	14	10	10	1	2026-10-28 19:00:00	\N	\N
84	1	9	9	15	7	1	2026-10-28 20:30:00	\N	\N
85	1	9	16	8	13	1	2026-10-28 21:00:00	\N	\N
86	1	9	7	17	5	1	2026-10-29 15:00:00	\N	\N
87	1	9	18	6	15	1	2026-10-29 17:00:00	\N	\N
88	1	9	5	19	1	1	2026-10-29 19:00:00	\N	\N
89	1	9	20	4	17	1	2026-10-29 20:30:00	\N	\N
90	1	9	3	2	3	1	2026-10-29 21:00:00	\N	\N
91	1	10	11	1	9	1	2026-11-01 15:00:00	\N	\N
92	1	10	12	10	10	1	2026-11-01 17:00:00	\N	\N
93	1	10	9	13	7	1	2026-11-01 19:00:00	\N	\N
94	1	10	14	8	10	1	2026-11-01 20:30:00	\N	\N
95	1	10	7	15	5	1	2026-11-01 21:00:00	\N	\N
96	1	10	16	6	13	1	2026-11-02 15:00:00	\N	\N
97	1	10	5	17	1	1	2026-11-02 17:00:00	\N	\N
98	1	10	18	4	15	1	2026-11-02 19:00:00	\N	\N
1	1	1	1	20	1	3	2026-09-26 15:00:00	2	1
2	1	1	2	19	2	3	2026-09-26 17:00:00	1	2
5	1	1	5	16	1	3	2026-09-27 14:00:00	2	1
99	1	10	3	19	3	1	2026-11-02 20:30:00	\N	\N
100	1	10	20	2	17	1	2026-11-02 21:00:00	\N	\N
101	1	11	1	10	1	1	2026-11-05 15:00:00	\N	\N
102	1	11	9	11	7	1	2026-11-05 17:00:00	\N	\N
103	1	11	12	8	10	1	2026-11-05 19:00:00	\N	\N
104	1	11	7	13	5	1	2026-11-05 20:30:00	\N	\N
105	1	11	14	6	10	1	2026-11-05 21:00:00	\N	\N
106	1	11	5	15	1	1	2026-11-06 15:00:00	\N	\N
107	1	11	16	4	13	1	2026-11-06 17:00:00	\N	\N
108	1	11	3	17	3	1	2026-11-06 19:00:00	\N	\N
109	1	11	18	2	15	1	2026-11-06 20:30:00	\N	\N
110	1	11	20	19	17	1	2026-11-06 21:00:00	\N	\N
111	1	12	9	1	7	1	2026-11-09 15:00:00	\N	\N
112	1	12	10	8	8	1	2026-11-09 17:00:00	\N	\N
113	1	12	7	11	5	1	2026-11-09 19:00:00	\N	\N
114	1	12	12	6	10	1	2026-11-09 20:30:00	\N	\N
115	1	12	5	13	1	1	2026-11-09 21:00:00	\N	\N
116	1	12	14	4	10	1	2026-11-10 15:00:00	\N	\N
117	1	12	3	15	3	1	2026-11-10 17:00:00	\N	\N
118	1	12	16	2	13	1	2026-11-10 19:00:00	\N	\N
119	1	12	20	17	17	1	2026-11-10 20:30:00	\N	\N
120	1	12	18	19	15	1	2026-11-10 21:00:00	\N	\N
121	1	13	1	8	1	1	2026-11-13 15:00:00	\N	\N
122	1	13	7	9	5	1	2026-11-13 17:00:00	\N	\N
123	1	13	10	6	8	1	2026-11-13 19:00:00	\N	\N
124	1	13	5	11	1	1	2026-11-13 20:30:00	\N	\N
125	1	13	12	4	10	1	2026-11-13 21:00:00	\N	\N
126	1	13	3	13	3	1	2026-11-14 15:00:00	\N	\N
127	1	13	14	2	10	1	2026-11-14 17:00:00	\N	\N
128	1	13	20	15	17	1	2026-11-14 19:00:00	\N	\N
129	1	13	16	19	13	1	2026-11-14 20:30:00	\N	\N
130	1	13	18	17	15	1	2026-11-14 21:00:00	\N	\N
131	1	14	7	1	5	1	2026-11-17 15:00:00	\N	\N
132	1	14	8	6	6	1	2026-11-17 17:00:00	\N	\N
133	1	14	5	9	1	1	2026-11-17 19:00:00	\N	\N
134	1	14	10	4	8	1	2026-11-17 20:30:00	\N	\N
135	1	14	3	11	3	1	2026-11-17 21:00:00	\N	\N
136	1	14	12	2	10	1	2026-11-18 15:00:00	\N	\N
137	1	14	20	13	17	1	2026-11-18 17:00:00	\N	\N
138	1	14	14	19	10	1	2026-11-18 19:00:00	\N	\N
139	1	14	18	15	15	1	2026-11-18 20:30:00	\N	\N
140	1	14	16	17	13	1	2026-11-18 21:00:00	\N	\N
141	1	15	1	6	1	1	2026-11-21 15:00:00	\N	\N
142	1	15	5	7	1	1	2026-11-21 17:00:00	\N	\N
143	1	15	8	4	6	1	2026-11-21 19:00:00	\N	\N
144	1	15	3	9	3	1	2026-11-21 20:30:00	\N	\N
145	1	15	10	2	8	1	2026-11-21 21:00:00	\N	\N
146	1	15	20	11	17	1	2026-11-22 15:00:00	\N	\N
147	1	15	12	19	10	1	2026-11-22 17:00:00	\N	\N
148	1	15	18	13	15	1	2026-11-22 19:00:00	\N	\N
149	1	15	14	17	10	1	2026-11-22 20:30:00	\N	\N
150	1	15	16	15	13	1	2026-11-22 21:00:00	\N	\N
151	1	16	5	1	1	1	2026-11-25 15:00:00	\N	\N
152	1	16	6	4	4	1	2026-11-25 17:00:00	\N	\N
153	1	16	3	7	3	1	2026-11-25 19:00:00	\N	\N
154	1	16	8	2	6	1	2026-11-25 20:30:00	\N	\N
155	1	16	20	9	17	1	2026-11-25 21:00:00	\N	\N
156	1	16	10	19	8	1	2026-11-26 15:00:00	\N	\N
157	1	16	18	11	15	1	2026-11-26 17:00:00	\N	\N
158	1	16	12	17	10	1	2026-11-26 19:00:00	\N	\N
159	1	16	16	13	13	1	2026-11-26 20:30:00	\N	\N
160	1	16	14	15	10	1	2026-11-26 21:00:00	\N	\N
161	1	17	1	4	1	1	2026-11-29 15:00:00	\N	\N
162	1	17	3	5	3	1	2026-11-29 17:00:00	\N	\N
163	1	17	6	2	4	1	2026-11-29 19:00:00	\N	\N
164	1	17	20	7	17	1	2026-11-29 20:30:00	\N	\N
165	1	17	8	19	6	1	2026-11-29 21:00:00	\N	\N
166	1	17	18	9	15	1	2026-11-30 15:00:00	\N	\N
167	1	17	10	17	8	1	2026-11-30 17:00:00	\N	\N
168	1	17	16	11	13	1	2026-11-30 19:00:00	\N	\N
169	1	17	12	15	10	1	2026-11-30 20:30:00	\N	\N
170	1	17	14	13	10	1	2026-11-30 21:00:00	\N	\N
171	1	18	3	1	3	1	2026-12-03 15:00:00	\N	\N
172	1	18	4	2	2	1	2026-12-03 17:00:00	\N	\N
173	1	18	20	5	17	1	2026-12-03 19:00:00	\N	\N
174	1	18	6	19	4	1	2026-12-03 20:30:00	\N	\N
175	1	18	18	7	15	1	2026-12-03 21:00:00	\N	\N
176	1	18	8	17	6	1	2026-12-04 15:00:00	\N	\N
177	1	18	16	9	13	1	2026-12-04 17:00:00	\N	\N
178	1	18	10	15	8	1	2026-12-04 19:00:00	\N	\N
179	1	18	14	11	10	1	2026-12-04 20:30:00	\N	\N
180	1	18	12	13	10	1	2026-12-04 21:00:00	\N	\N
181	1	19	1	2	1	1	2026-12-07 15:00:00	\N	\N
182	1	19	20	3	17	1	2026-12-07 17:00:00	\N	\N
183	1	19	4	19	2	1	2026-12-07 19:00:00	\N	\N
184	1	19	18	5	15	1	2026-12-07 20:30:00	\N	\N
185	1	19	6	17	4	1	2026-12-07 21:00:00	\N	\N
186	1	19	16	7	13	1	2026-12-08 15:00:00	\N	\N
187	1	19	8	15	6	1	2026-12-08 17:00:00	\N	\N
188	1	19	14	9	10	1	2026-12-08 19:00:00	\N	\N
189	1	19	10	13	8	1	2026-12-08 20:30:00	\N	\N
190	1	19	12	11	10	1	2026-12-08 21:00:00	\N	\N
3	1	1	3	18	3	3	2026-09-26 19:00:00	2	1
4	1	1	4	17	2	3	2026-09-26 20:30:00	2	0
191	2	1	6	14	4	3	2024-01-20 18:10:00	1	2
192	2	1	9	17	7	3	2024-01-20 16:00:00	2	1
193	2	1	15	4	12	3	2024-01-22 20:20:00	0	1
194	2	1	19	7	16	3	2024-01-19 20:15:00	2	2
195	2	1	20	8	18	3	2024-01-21 18:10:00	2	0
196	2	1	2	5	2	3	2024-01-21 16:00:00	5	0
197	2	1	3	10	3	3	2024-01-20 20:20:00	0	1
198	2	1	22	18	14	3	2024-01-19 18:00:00	0	1
199	2	1	12	21	10	3	2024-01-22 18:10:00	0	0
200	2	1	1	16	1	3	2024-01-21 20:20:00	3	1
\.


--
-- Data for Name: partidoregla; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.partidoregla (partidoreglaid, partidoid, reglaid, cuota, estado) FROM stdin;
20	3	6	2.2400	f
16	3	2	2.9000	f
15	3	1	1.8000	f
17	3	3	3.3100	f
18	3	4	2.0300	f
19	3	5	2.2700	f
13	2	6	1.5100	f
9	2	2	3.4800	f
8	2	1	2.9400	f
10	2	3	1.7600	f
11	2	4	1.8600	f
12	2	5	1.8600	f
21	3	7	2.2800	f
7	1	7	2.0900	f
14	2	7	1.6100	f
28	4	7	1.8000	f
35	5	7	2.4700	f
42	6	7	1.9900	t
49	7	7	2.6600	t
56	8	7	2.1800	t
63	9	7	1.7000	t
70	10	7	2.3700	t
77	11	7	1.6500	t
84	12	7	2.5500	t
91	13	7	2.0100	t
98	14	7	1.8800	t
105	15	7	1.6800	t
112	16	7	2.0700	t
119	17	7	2.5000	t
126	18	7	2.2600	t
133	19	7	2.1700	t
140	20	7	2.4500	t
147	21	7	2.2800	t
154	22	7	2.3700	t
161	23	7	2.1500	t
168	24	7	2.5000	t
175	25	7	2.6300	t
182	26	7	2.1700	t
189	27	7	1.6700	t
196	28	7	1.8400	t
203	29	7	1.8600	t
210	30	7	2.6600	t
217	31	7	1.5800	t
224	32	7	1.5600	t
231	33	7	1.7100	t
238	34	7	1.7500	t
245	35	7	1.8400	t
252	36	7	2.2300	t
259	37	7	2.6600	t
266	38	7	2.4200	t
273	39	7	2.3300	t
280	40	7	2.6100	t
287	41	7	2.4700	t
294	42	7	2.5300	t
301	43	7	2.3100	t
308	44	7	2.2000	t
315	45	7	2.5000	t
322	46	7	2.3300	t
329	47	7	1.8300	t
336	48	7	2.0000	t
343	49	7	2.0200	t
350	50	7	1.6700	t
357	51	7	2.6600	t
364	52	7	1.7200	t
371	53	7	1.8700	t
378	54	7	1.9100	t
385	55	7	2.6900	t
392	56	7	2.1000	t
399	57	7	1.6700	t
406	58	7	2.5800	t
413	59	7	2.4900	t
420	60	7	1.6200	t
427	61	7	2.6600	t
434	62	7	2.6900	t
441	63	7	2.4700	t
448	64	7	2.3600	t
455	65	7	2.6600	t
462	66	7	2.0300	t
469	67	7	1.7000	t
476	68	7	2.1600	t
483	69	7	2.1800	t
490	70	7	1.8300	t
497	71	7	2.5900	t
504	72	7	1.8800	t
511	73	7	2.0300	t
518	74	7	2.0700	t
525	75	7	1.7000	t
532	76	7	2.2600	t
539	77	7	2.5200	t
546	78	7	2.4500	t
553	79	7	2.6500	t
560	80	7	1.7800	t
567	81	7	1.7000	t
574	82	7	1.7000	t
581	83	7	2.6300	t
588	84	7	2.5200	t
595	85	7	1.6700	t
602	86	7	2.1900	t
609	87	7	1.8600	t
616	88	7	1.8600	t
623	89	7	2.0500	t
630	90	7	1.9900	t
637	91	7	2.5200	t
644	92	7	2.0400	t
651	93	7	2.1900	t
658	94	7	2.2300	t
665	95	7	1.8600	t
672	96	7	2.4200	t
679	97	7	2.6800	t
686	98	7	2.6100	t
693	99	7	2.3500	t
700	100	7	1.6500	t
707	101	7	1.8900	t
714	102	7	1.8600	t
721	103	7	1.6400	t
728	104	7	2.6800	t
735	105	7	1.8300	t
742	106	7	2.3500	t
749	107	7	2.0200	t
756	108	7	2.0200	t
763	109	7	2.2100	t
770	110	7	2.5500	t
777	111	7	2.4500	t
784	112	7	2.2000	t
791	113	7	2.3500	t
798	114	7	2.3900	t
805	115	7	2.0200	t
812	116	7	2.5800	t
819	117	7	1.6900	t
826	118	7	1.6200	t
833	119	7	2.2200	t
840	120	7	2.5000	t
847	121	7	2.0800	t
854	122	7	2.0200	t
861	123	7	1.8000	t
868	124	7	1.6900	t
875	125	7	1.9900	t
882	126	7	2.5100	t
889	127	7	2.1800	t
896	128	7	1.8900	t
903	129	7	1.9100	t
910	130	7	1.5600	t
917	131	7	2.3800	t
924	132	7	2.3600	t
931	133	7	2.5100	t
938	134	7	2.5500	t
945	135	7	2.1800	t
952	136	7	1.5900	t
959	137	7	1.5600	t
966	138	7	2.4700	t
973	139	7	2.3800	t
980	140	7	2.6600	t
987	141	7	2.2700	t
994	142	7	2.1800	t
1001	143	7	1.9600	t
1008	144	7	1.8500	t
1015	145	7	2.1500	t
1022	146	7	2.3800	t
1029	147	7	1.8800	t
1036	148	7	2.0500	t
1043	149	7	2.0700	t
1050	150	7	1.7200	t
1057	151	7	2.3100	t
1064	152	7	2.5200	t
1071	153	7	2.6700	t
1078	154	7	1.5600	t
1085	155	7	2.0500	t
1092	156	7	2.4400	t
1099	157	7	1.7200	t
1106	158	7	2.6300	t
1113	159	7	2.5400	t
1120	160	7	1.6700	t
1127	161	7	2.4600	t
1134	162	7	2.3400	t
1141	163	7	2.1200	t
1148	164	7	1.7200	t
1155	165	7	1.8500	t
1162	166	7	2.5400	t
1169	167	7	2.0400	t
1176	168	7	2.2100	t
1183	169	7	2.2300	t
1190	170	7	1.8800	t
1197	171	7	2.2400	t
1204	172	7	2.6800	t
1211	173	7	2.5400	t
1218	174	7	2.4100	t
1225	175	7	2.2100	t
1232	176	7	2.6000	t
1239	177	7	1.8800	t
1246	178	7	1.6400	t
1253	179	7	1.5500	t
1260	180	7	1.8300	t
1267	181	7	2.6500	t
1274	182	7	2.2100	t
1281	183	7	1.8200	t
1288	184	7	1.8800	t
1295	185	7	2.0100	t
1302	186	7	1.5500	t
1309	187	7	2.2000	t
1316	188	7	2.3700	t
1323	189	7	2.3900	t
1330	190	7	2.0400	t
41	6	6	2.2300	t
48	7	6	1.8600	t
55	8	6	2.5900	t
62	9	6	2.2200	t
69	10	6	1.8500	t
76	11	6	1.5200	t
83	12	6	2.1700	t
90	13	6	2.0100	t
97	14	6	2.3400	t
104	15	6	2.1900	t
111	16	6	1.6000	t
118	17	6	2.3700	t
125	18	6	1.9600	t
132	19	6	2.5500	t
139	20	6	2.3200	t
146	21	6	1.7400	t
153	22	6	2.0000	t
160	23	6	2.2700	t
167	24	6	2.5700	t
174	25	6	2.4400	t
181	26	6	1.6500	t
188	27	6	1.7000	t
195	28	6	1.8300	t
202	29	6	2.0600	t
209	30	6	2.0100	t
216	31	6	1.8400	t
223	32	6	2.0100	t
230	33	6	2.5600	t
237	34	6	2.3700	t
244	35	6	2.0300	t
251	36	6	2.5400	t
258	37	6	2.2100	t
265	38	6	1.8000	t
272	39	6	2.3900	t
279	40	6	2.1600	t
286	41	6	1.6000	t
293	42	6	1.8400	t
300	43	6	2.1100	t
307	44	6	2.0200	t
314	45	6	2.4700	t
321	46	6	2.5900	t
328	47	6	1.5400	t
335	48	6	1.6700	t
342	49	6	1.9000	t
349	50	6	1.8500	t
6	1	6	1.8800	f
27	4	6	1.8700	f
34	5	6	1.5000	f
356	51	6	2.1600	t
363	52	6	1.8500	t
370	53	6	2.4000	t
377	54	6	2.2100	t
384	55	6	2.5800	t
391	56	6	2.5700	t
398	57	6	2.0500	t
405	58	6	1.6400	t
412	59	6	2.2300	t
419	60	6	2.0000	t
426	61	6	2.5600	t
433	62	6	1.6800	t
440	63	6	1.9500	t
447	64	6	1.8600	t
454	65	6	2.3100	t
461	66	6	2.0400	t
468	67	6	1.5700	t
475	68	6	1.5100	t
482	69	6	1.7400	t
489	70	6	1.6900	t
496	71	6	2.4800	t
503	72	6	1.6900	t
510	73	6	2.2400	t
517	74	6	2.0500	t
524	75	6	2.4200	t
531	76	6	2.4100	t
538	77	6	1.5000	t
545	78	6	1.6700	t
552	79	6	2.0700	t
559	80	6	1.8400	t
566	81	6	2.4200	t
573	82	6	1.5200	t
580	83	6	1.7900	t
587	84	6	1.7000	t
594	85	6	2.1500	t
601	86	6	1.8800	t
608	87	6	2.5100	t
615	88	6	2.0600	t
622	89	6	1.7700	t
629	90	6	1.5300	t
636	91	6	1.7000	t
643	92	6	1.5300	t
650	93	6	2.0800	t
657	94	6	1.8900	t
664	95	6	2.2600	t
671	96	6	2.2500	t
678	97	6	2.4400	t
685	98	6	1.5100	t
692	99	6	1.5200	t
699	100	6	1.8700	t
706	101	6	2.2800	t
713	102	6	2.4600	t
720	103	6	1.6300	t
727	104	6	1.5400	t
734	105	6	1.9900	t
741	106	6	1.7200	t
748	107	6	2.3500	t
755	108	6	1.9000	t
762	109	6	1.6100	t
769	110	6	2.2700	t
776	111	6	2.0200	t
783	112	6	2.4700	t
790	113	6	1.9200	t
797	114	6	1.7300	t
804	115	6	2.1000	t
811	116	6	2.0900	t
818	117	6	2.2800	t
825	118	6	2.4500	t
832	119	6	1.5500	t
839	120	6	2.4200	t
846	121	6	2.1400	t
853	122	6	2.3000	t
860	123	6	2.5700	t
867	124	6	2.4800	t
874	125	6	1.8300	t
881	126	6	1.5600	t
888	127	6	2.1900	t
895	128	6	1.9300	t
902	129	6	2.1600	t
909	130	6	2.1100	t
916	131	6	2.3400	t
923	132	6	2.3100	t
930	133	6	1.7600	t
937	134	6	1.5700	t
944	135	6	1.9400	t
951	136	6	1.9300	t
958	137	6	2.3100	t
965	138	6	1.9000	t
972	139	6	2.4900	t
979	140	6	2.2600	t
986	141	6	2.0000	t
993	142	6	2.1400	t
1000	143	6	2.4100	t
1007	144	6	2.3200	t
1014	145	6	1.6700	t
1021	146	6	1.5900	t
1028	147	6	1.6400	t
1035	148	6	1.7700	t
1042	149	6	2.0000	t
1049	150	6	1.9500	t
1056	151	6	1.5600	t
1063	152	6	2.1500	t
1070	153	6	1.6000	t
1077	154	6	2.5100	t
1084	155	6	1.9700	t
1091	156	6	2.4800	t
1098	157	6	2.1500	t
1105	158	6	1.7400	t
1112	159	6	2.3300	t
1119	160	6	2.1000	t
1126	161	6	1.8600	t
1133	162	6	1.9800	t
1140	163	6	2.2500	t
1147	164	6	2.3500	t
1154	165	6	2.2200	t
1161	166	6	2.5300	t
1168	167	6	2.5800	t
1175	168	6	1.6100	t
1182	169	6	1.8400	t
1189	170	6	1.7900	t
1196	171	6	1.8800	t
1203	172	6	1.9900	t
1210	173	6	1.6300	t
1217	174	6	1.9600	t
1224	175	6	1.8100	t
1231	176	6	2.3200	t
1238	177	6	1.9900	t
1245	178	6	1.5800	t
1252	179	6	2.1700	t
1259	180	6	1.9400	t
1266	181	6	1.7200	t
1273	182	6	2.0100	t
1280	183	6	1.7000	t
1287	184	6	2.1900	t
1294	185	6	2.0600	t
1301	186	6	2.3700	t
1308	187	6	2.4200	t
1315	188	6	2.5500	t
1322	189	6	1.6800	t
1329	190	6	1.6300	t
37	6	2	4.1800	t
44	7	2	3.6000	t
51	8	2	3.0200	t
58	9	2	3.9500	t
65	10	2	3.3700	t
72	11	2	3.0400	t
79	12	2	2.8000	t
86	13	2	3.4200	t
93	14	2	4.0300	t
100	15	2	2.9800	t
107	16	2	2.8700	t
114	17	2	4.0500	t
2	1	2	4.0600	f
23	4	2	3.8300	f
30	5	2	3.2500	f
121	18	2	3.2200	t
128	19	2	3.6100	t
135	20	2	3.5700	t
142	21	2	3.9700	t
149	22	2	3.3600	t
156	23	2	3.9300	t
163	24	2	3.4000	t
170	25	2	3.6500	t
177	26	2	2.9600	t
184	27	2	4.0000	t
191	28	2	4.0300	t
198	29	2	2.8400	t
205	30	2	3.5900	t
212	31	2	3.3100	t
219	32	2	3.2000	t
226	33	2	3.3400	t
233	34	2	3.5500	t
240	35	2	3.3800	t
247	36	2	3.2700	t
254	37	2	2.9400	t
261	38	2	3.6200	t
268	39	2	4.0100	t
275	40	2	3.9700	t
282	41	2	3.8800	t
289	42	2	3.7600	t
296	43	2	2.8200	t
303	44	2	3.3200	t
310	45	2	3.1700	t
317	46	2	3.3600	t
324	47	2	2.8900	t
331	48	2	2.9200	t
338	49	2	3.2400	t
345	50	2	3.9900	t
352	51	2	3.5800	t
359	52	2	3.6000	t
366	53	2	3.7400	t
373	54	2	3.9500	t
380	55	2	3.3000	t
387	56	2	4.3000	t
394	57	2	3.3400	t
401	58	2	4.0200	t
408	59	2	2.9000	t
415	60	2	2.8600	t
422	61	2	3.7900	t
429	62	2	4.1600	t
436	63	2	3.2200	t
443	64	2	3.7200	t
450	65	2	3.5700	t
457	66	2	3.2800	t
464	67	2	3.9200	t
471	68	2	3.3200	t
478	69	2	3.6400	t
485	70	2	2.8800	t
492	71	2	3.8500	t
499	72	2	4.0000	t
506	73	2	4.1400	t
513	74	2	2.8400	t
520	75	2	3.7000	t
527	76	2	3.1900	t
534	77	2	3.2600	t
541	78	2	3.5400	t
548	79	2	3.3000	t
555	80	2	3.2600	t
562	81	2	3.7000	t
569	82	2	3.0500	t
576	83	2	3.6200	t
583	84	2	4.1200	t
590	85	2	3.9700	t
597	86	2	3.6800	t
604	87	2	2.8100	t
611	88	2	3.2400	t
618	89	2	3.1600	t
625	90	2	3.2800	t
632	91	2	4.1200	t
639	92	2	2.8900	t
646	93	2	3.0300	t
653	94	2	3.2400	t
660	95	2	4.1000	t
667	96	2	3.5900	t
674	97	2	3.6600	t
681	98	2	3.9400	t
688	99	2	3.2200	t
695	100	2	4.2900	t
702	101	2	3.6100	t
709	102	2	3.4500	t
716	103	2	4.0200	t
723	104	2	3.0100	t
730	105	2	2.8600	t
737	106	2	4.0800	t
744	107	2	3.2100	t
751	108	2	3.6400	t
758	109	2	3.5600	t
765	110	2	3.8300	t
772	111	2	2.8800	t
779	112	2	3.2900	t
786	113	2	3.4300	t
793	114	2	3.6400	t
800	115	2	2.9900	t
807	116	2	3.9900	t
814	117	2	4.0600	t
821	118	2	2.8300	t
828	119	2	4.2500	t
835	120	2	4.2100	t
842	121	2	3.5200	t
849	122	2	3.8500	t
856	123	2	2.9100	t
863	124	2	3.4100	t
870	125	2	3.2600	t
877	126	2	2.9700	t
884	127	2	3.6100	t
891	128	2	3.1600	t
898	129	2	3.4800	t
905	130	2	4.2300	t
912	131	2	3.1500	t
919	132	2	3.6900	t
926	133	2	3.8300	t
933	134	2	4.0400	t
940	135	2	3.3900	t
947	136	2	2.8800	t
954	137	2	3.5800	t
961	138	2	4.2600	t
968	139	2	3.1400	t
975	140	2	3.1000	t
982	141	2	3.4300	t
989	142	2	4.2500	t
996	143	2	3.3100	t
1003	144	2	3.8100	t
1010	145	2	3.6600	t
1017	146	2	4.0000	t
1024	147	2	3.5300	t
1031	148	2	3.5600	t
1038	149	2	3.8800	t
1045	150	2	3.1200	t
1052	151	2	3.4200	t
1059	152	2	4.0900	t
1066	153	2	4.2300	t
1073	154	2	2.9300	t
1080	155	2	2.9100	t
1087	156	2	2.8000	t
1094	157	2	3.9800	t
1101	158	2	3.1500	t
1108	159	2	3.5400	t
1115	160	2	3.5000	t
1122	161	2	3.3400	t
1129	162	2	3.1400	t
1136	163	2	3.7100	t
1143	164	2	3.3300	t
1150	165	2	3.5800	t
1157	166	2	2.8900	t
1164	167	2	3.9300	t
1171	168	2	3.9600	t
1178	169	2	4.2800	t
1185	170	2	3.5200	t
1192	171	2	3.6900	t
1199	172	2	2.9800	t
1206	173	2	3.7500	t
1213	174	2	2.8500	t
1220	175	2	3.3100	t
1227	176	2	3.2000	t
1234	177	2	2.8700	t
1241	178	2	3.5500	t
1248	179	2	3.9400	t
1255	180	2	3.9000	t
1262	181	2	3.2500	t
1269	182	2	4.1700	t
1276	183	2	3.6300	t
1283	184	2	3.7300	t
1290	185	2	3.9800	t
1297	186	2	3.2900	t
1304	187	2	2.8200	t
1311	188	2	2.8500	t
1318	189	2	3.1700	t
1325	190	2	3.9200	t
36	6	1	2.7300	t
43	7	1	1.5900	t
50	8	1	1.9000	t
57	9	1	2.2100	t
64	10	1	2.5200	t
71	11	1	2.4100	t
78	12	1	2.5100	t
85	13	1	1.5900	t
92	14	1	2.8000	t
99	15	1	2.4500	t
106	16	1	1.9700	t
113	17	1	1.8600	t
120	18	1	2.5900	t
127	19	1	2.7200	t
134	20	1	1.7600	t
141	21	1	2.9000	t
148	22	1	1.8700	t
155	23	1	2.0600	t
162	24	1	2.7100	t
169	25	1	2.3500	t
176	26	1	2.1200	t
183	27	1	2.9700	t
190	28	1	2.9800	t
197	29	1	2.1400	t
204	30	1	2.3900	t
211	31	1	2.8000	t
218	32	1	2.4400	t
225	33	1	2.9900	t
232	34	1	1.6100	t
239	35	1	2.3800	t
246	36	1	1.9000	t
253	37	1	1.7900	t
260	38	1	2.5200	t
267	39	1	2.6500	t
274	40	1	1.6900	t
281	41	1	1.7200	t
288	42	1	1.8000	t
295	43	1	1.9900	t
302	44	1	2.6600	t
309	45	1	2.6100	t
316	46	1	2.0500	t
323	47	1	2.9000	t
330	48	1	2.9100	t
337	49	1	2.0700	t
344	50	1	2.3200	t
351	51	1	1.7400	t
358	52	1	2.3700	t
365	53	1	2.9200	t
372	54	1	2.9900	t
379	55	1	2.3300	t
386	56	1	2.1600	t
393	57	1	1.7200	t
400	58	1	2.4500	t
407	59	1	2.5800	t
414	60	1	1.6200	t
421	61	1	1.9900	t
428	62	1	1.7300	t
435	63	1	1.9200	t
442	64	1	2.5900	t
449	65	1	2.5400	t
456	66	1	2.0000	t
463	67	1	1.7100	t
470	68	1	2.8400	t
477	69	1	2.0000	t
484	70	1	2.2500	t
491	71	1	2.1300	t
498	72	1	2.3000	t
505	73	1	2.8500	t
512	74	1	2.9200	t
519	75	1	2.2600	t
526	76	1	2.0900	t
533	77	1	1.6700	t
540	78	1	2.7100	t
547	79	1	2.5100	t
554	80	1	1.5500	t
561	81	1	2.2600	t
568	82	1	1.6600	t
575	83	1	1.8500	t
582	84	1	2.5200	t
589	85	1	2.4700	t
596	86	1	1.9300	t
603	87	1	1.6400	t
610	88	1	2.7900	t
617	89	1	2.2600	t
624	90	1	2.1800	t
631	91	1	2.5200	t
638	92	1	2.2300	t
645	93	1	2.7800	t
652	94	1	2.8500	t
659	95	1	2.1900	t
666	96	1	2.0200	t
673	97	1	1.6000	t
680	98	1	2.6400	t
687	99	1	2.4600	t
694	100	1	1.8100	t
701	101	1	2.5300	t
708	102	1	1.5900	t
715	103	1	1.7800	t
722	104	1	2.4500	t
729	105	1	2.4000	t
736	106	1	1.8600	t
743	107	1	1.5700	t
750	108	1	2.7200	t
757	109	1	2.1900	t
764	110	1	2.4600	t
771	111	1	2.9100	t
778	112	1	2.1600	t
785	113	1	2.7100	t
792	114	1	2.7800	t
799	115	1	2.1200	t
806	116	1	1.9500	t
813	117	1	2.9800	t
820	118	1	2.5700	t
827	119	1	2.7200	t
834	120	1	1.7600	t
841	121	1	2.8000	t
848	122	1	2.9700	t
855	123	1	1.7100	t
862	124	1	2.3800	t
869	125	1	2.3300	t
876	126	1	1.7900	t
883	127	1	2.9500	t
890	128	1	2.9800	t
897	129	1	2.1400	t
904	130	1	2.3900	t
911	131	1	1.8500	t
918	132	1	2.0900	t
925	133	1	2.6400	t
932	134	1	2.7100	t
939	135	1	2.0500	t
946	136	1	1.8800	t
953	137	1	1.7900	t
960	138	1	2.5200	t
967	139	1	2.6500	t
974	140	1	1.6900	t
981	141	1	1.6200	t
1	1	1	2.6300	f
22	4	1	2.1100	f
29	5	1	2.4200	f
988	142	1	2.9000	t
995	143	1	1.6400	t
1002	144	1	2.3100	t
1009	145	1	2.2600	t
1016	146	1	2.0500	t
1023	147	1	2.9000	t
1030	148	1	2.9100	t
1037	149	1	2.0700	t
1044	150	1	2.3200	t
1051	151	1	2.2400	t
1058	152	1	2.0200	t
1065	153	1	2.5700	t
1072	154	1	2.6400	t
1079	155	1	2.3100	t
1086	156	1	1.8300	t
1093	157	1	1.7200	t
1100	158	1	2.4500	t
1107	159	1	2.5800	t
1114	160	1	1.6200	t
1121	161	1	1.8900	t
1128	162	1	2.8300	t
1135	163	1	1.5700	t
1142	164	1	2.5700	t
1149	165	1	2.2100	t
1156	166	1	1.9800	t
1163	167	1	2.8300	t
1170	168	1	2.8400	t
1177	169	1	2.0000	t
1184	170	1	2.2500	t
1191	171	1	2.6300	t
1198	172	1	1.9500	t
1205	173	1	2.8300	t
1212	174	1	2.5900	t
1219	175	1	2.2400	t
1226	176	1	1.7600	t
1233	177	1	1.6500	t
1240	178	1	2.3800	t
1247	179	1	2.5100	t
1254	180	1	1.5500	t
1261	181	1	2.1600	t
1268	182	1	1.6400	t
1275	183	1	2.9700	t
1282	184	1	2.5000	t
1289	185	1	2.1400	t
1296	186	1	1.9100	t
1303	187	1	2.7600	t
1310	188	1	2.7700	t
1317	189	1	1.9300	t
1324	190	1	2.1800	t
38	6	3	1.8100	t
45	7	3	3.3600	t
52	8	3	2.8600	t
59	9	3	2.3600	t
66	10	3	1.8600	t
73	11	3	3.3600	t
80	12	3	3.0600	t
87	13	3	2.4100	t
94	14	3	2.3100	t
101	15	3	2.6100	t
108	16	3	3.3600	t
115	17	3	2.8100	t
122	18	3	2.3600	t
129	19	3	3.0100	t
136	20	3	3.4100	t
143	21	3	2.9600	t
150	22	3	3.1600	t
157	23	3	2.0600	t
164	24	3	2.0100	t
171	25	3	3.3600	t
178	26	3	2.2100	t
185	27	3	2.3600	t
192	28	3	2.4100	t
199	29	3	3.4100	t
206	30	3	2.6100	t
213	31	3	2.6100	t
220	32	3	2.0600	t
227	33	3	2.7600	t
234	34	3	3.1100	t
241	35	3	3.6600	t
248	36	3	2.3600	t
255	37	3	1.8100	t
262	38	3	3.4100	t
269	39	3	2.0100	t
276	40	3	2.4100	t
283	41	3	3.6600	t
290	42	3	2.1600	t
297	43	3	3.1100	t
304	44	3	2.3600	t
311	45	3	2.1100	t
318	46	3	3.2600	t
325	47	3	3.4100	t
332	48	3	3.4600	t
339	49	3	2.4100	t
346	50	3	3.6600	t
353	51	3	1.8600	t
360	52	3	3.1100	t
367	53	3	1.7600	t
374	54	3	2.1100	t
381	55	3	1.9600	t
388	56	3	3.1600	t
395	57	3	2.8600	t
402	58	3	2.4100	t
409	59	3	3.0600	t
416	60	3	3.4600	t
423	61	3	2.3100	t
430	62	3	3.2100	t
437	63	3	2.1100	t
444	64	3	3.4100	t
451	65	3	3.1600	t
458	66	3	3.6100	t
465	67	3	2.1600	t
472	68	3	2.4600	t
479	69	3	3.4600	t
486	70	3	2.6600	t
493	71	3	3.1600	t
500	72	3	2.1100	t
507	73	3	2.8100	t
514	74	3	3.1600	t
521	75	3	3.0100	t
528	76	3	2.1600	t
535	77	3	3.2100	t
542	78	3	3.2100	t
549	79	3	2.0600	t
556	80	3	2.4600	t
563	81	3	3.0100	t
570	82	3	2.2100	t
577	83	3	3.1600	t
584	84	3	2.4100	t
591	85	3	2.1600	t
598	86	3	2.6100	t
605	87	3	3.2100	t
612	88	3	2.8100	t
619	89	3	2.2100	t
626	90	3	1.6600	t
633	91	3	2.4100	t
640	92	3	3.1600	t
647	93	3	1.8100	t
654	94	3	2.1600	t
661	95	3	2.0100	t
668	96	3	3.2100	t
675	97	3	2.2100	t
682	98	3	2.2100	t
689	99	3	2.4100	t
696	100	3	3.2600	t
703	101	3	1.6600	t
710	102	3	3.2600	t
717	103	3	2.1600	t
724	104	3	3.4600	t
731	105	3	3.2100	t
738	106	3	3.6600	t
745	107	3	2.2100	t
752	108	3	1.8100	t
3	1	3	2.2600	f
24	4	3	2.8100	f
31	5	3	2.3100	f
759	109	3	3.2600	t
766	110	3	1.7600	t
773	111	3	1.6600	t
780	112	3	2.1600	t
787	113	3	2.8600	t
794	114	3	3.2100	t
801	115	3	3.0600	t
808	116	3	2.2100	t
815	117	3	3.2600	t
822	118	3	3.2600	t
829	119	3	3.2100	t
836	120	3	3.6100	t
843	121	3	2.3600	t
850	122	3	2.2600	t
857	123	3	3.2100	t
864	124	3	2.4600	t
871	125	3	2.2100	t
878	126	3	2.6600	t
885	127	3	3.2600	t
892	128	3	2.6100	t
899	129	3	3.6100	t
906	130	3	2.8100	t
913	131	3	2.9600	t
920	132	3	3.2100	t
927	133	3	1.8600	t
934	134	3	2.2100	t
941	135	3	2.0600	t
948	136	3	3.2600	t
955	137	3	2.0100	t
962	138	3	3.6100	t
969	139	3	2.2100	t
976	140	3	2.6100	t
983	141	3	3.0600	t
990	142	3	3.3100	t
997	143	3	2.2100	t
1004	144	3	3.5100	t
1011	145	3	3.2600	t
1018	146	3	3.4600	t
1025	147	3	3.6100	t
1032	148	3	3.6600	t
1039	149	3	2.6100	t
1046	150	3	1.8100	t
1053	151	3	2.2100	t
1060	152	3	2.2100	t
1067	153	3	2.9100	t
1074	154	3	3.2600	t
1081	155	3	2.8600	t
1088	156	3	3.6100	t
1095	157	3	3.0600	t
1102	158	3	2.6100	t
1109	159	3	3.2600	t
1116	160	3	3.6600	t
1123	161	3	1.7100	t
1130	162	3	2.3100	t
1137	163	3	3.2600	t
1144	164	3	2.2600	t
1151	165	3	3.6100	t
1158	166	3	2.4600	t
1165	167	3	2.6100	t
1172	168	3	2.6600	t
1179	169	3	3.6600	t
1186	170	3	2.8600	t
1193	171	3	3.5100	t
1200	172	3	3.2600	t
1207	173	3	1.6600	t
1214	174	3	3.6100	t
1221	175	3	1.8600	t
1228	176	3	2.6100	t
1235	177	3	2.0600	t
1242	178	3	3.6600	t
1249	179	3	2.2600	t
1256	180	3	2.6600	t
1263	181	3	2.4100	t
1270	182	3	3.1100	t
1277	183	3	3.6100	t
1284	184	3	3.3100	t
1291	185	3	2.6100	t
1298	186	3	3.5100	t
1305	187	3	3.6600	t
1312	188	3	1.6600	t
1319	189	3	2.6600	t
1326	190	3	1.8600	t
39	6	4	2.5400	t
46	7	4	1.7100	t
53	8	4	1.8800	t
60	9	4	2.0500	t
67	10	4	2.2200	t
74	11	4	2.4500	t
81	12	4	1.6000	t
88	13	4	1.8600	t
95	14	4	2.3300	t
102	15	4	1.8800	t
109	16	4	1.6700	t
116	17	4	1.9000	t
123	18	4	2.0100	t
130	19	4	1.9200	t
137	20	4	2.3500	t
144	21	4	2.3300	t
151	22	4	1.5700	t
158	23	4	1.9000	t
165	24	4	2.0000	t
172	25	4	1.6300	t
179	26	4	2.0200	t
186	27	4	1.9700	t
193	28	4	2.0400	t
200	29	4	2.3100	t
207	30	4	2.0600	t
214	31	4	1.9300	t
221	32	4	1.8600	t
228	33	4	1.7100	t
235	34	4	2.2000	t
242	35	4	2.1400	t
249	36	4	1.9300	t
256	37	4	2.1600	t
263	38	4	2.2700	t
270	39	4	2.1800	t
277	40	4	1.6100	t
284	41	4	1.9700	t
291	42	4	1.8300	t
298	43	4	2.1600	t
305	44	4	1.8500	t
312	45	4	2.5000	t
319	46	4	2.2800	t
326	47	4	2.2300	t
333	48	4	2.3000	t
340	49	4	1.5700	t
347	50	4	2.3200	t
354	51	4	2.4100	t
361	52	4	2.1200	t
368	53	4	1.9700	t
375	54	4	2.4600	t
382	55	4	1.9900	t
389	56	4	1.8000	t
396	57	4	2.4200	t
403	58	4	2.5300	t
410	59	4	2.4400	t
417	60	4	1.8700	t
424	61	4	1.6100	t
431	62	4	2.0900	t
438	63	4	2.4200	t
445	64	4	2.1100	t
452	65	4	1.7600	t
459	66	4	2.1300	t
466	67	4	2.1000	t
473	68	4	1.5600	t
480	69	4	1.8300	t
487	70	4	1.5800	t
494	71	4	1.8900	t
501	72	4	2.3800	t
508	73	4	2.2300	t
515	74	4	1.7200	t
522	75	4	2.2500	t
4	1	4	1.6900	f
25	4	4	2.2000	f
32	5	4	2.3700	f
529	76	4	2.0600	t
536	77	4	2.2700	t
543	78	4	2.4000	t
550	79	4	1.7000	t
557	80	4	2.1300	t
564	81	4	2.2500	t
571	82	4	2.3500	t
578	83	4	1.6800	t
585	84	4	2.3700	t
592	85	4	2.0200	t
599	86	4	2.3900	t
606	87	4	2.3600	t
613	88	4	2.4100	t
620	89	4	1.7000	t
627	90	4	1.8400	t
634	91	4	2.3700	t
641	92	4	1.6400	t
648	93	4	2.4900	t
655	94	4	1.9800	t
662	95	4	2.5100	t
669	96	4	2.3200	t
676	97	4	2.5300	t
683	98	4	1.6600	t
690	99	4	1.5500	t
697	100	4	2.0000	t
704	101	4	1.8900	t
711	102	4	1.6100	t
718	103	4	1.9400	t
725	104	4	1.6300	t
732	105	4	2.2800	t
739	106	4	1.6500	t
746	107	4	1.6200	t
753	108	4	1.6700	t
760	109	4	1.9600	t
767	110	4	2.3000	t
774	111	4	1.8500	t
781	112	4	1.9000	t
788	113	4	1.7500	t
795	114	4	2.2400	t
802	115	4	1.7700	t
809	116	4	1.5800	t
816	117	4	1.7900	t
823	118	4	1.9200	t
830	119	4	2.4200	t
837	120	4	1.8500	t
844	121	4	2.5300	t
851	122	4	1.8700	t
858	123	4	2.2000	t
865	124	4	1.8900	t
872	125	4	2.5400	t
879	126	4	1.9100	t
886	127	4	1.8800	t
893	128	4	2.5400	t
900	129	4	1.8100	t
907	130	4	1.5600	t
914	131	4	2.3300	t
921	132	4	2.1600	t
928	133	4	2.0100	t
935	134	4	2.5000	t
942	135	4	2.0300	t
949	136	4	1.8400	t
956	137	4	1.6600	t
963	138	4	1.7700	t
970	139	4	1.6800	t
977	140	4	2.1100	t
984	141	4	2.1700	t
991	142	4	2.1300	t
998	143	4	2.4600	t
1005	144	4	2.1500	t
1012	145	4	1.8000	t
1019	146	4	1.7800	t
1026	147	4	1.7300	t
1033	148	4	1.8000	t
1040	149	4	2.0700	t
1047	150	4	1.8200	t
1054	151	4	1.8100	t
1061	152	4	2.4200	t
1068	153	4	2.2700	t
1075	154	4	1.7600	t
1082	155	4	1.9000	t
1089	156	4	1.6900	t
1096	157	4	1.9200	t
1103	158	4	2.0300	t
1110	159	4	1.9400	t
1117	160	4	2.3700	t
1124	161	4	1.8100	t
1131	162	4	2.3900	t
1138	163	4	1.7200	t
1145	164	4	2.0200	t
1152	165	4	1.6500	t
1159	166	4	2.0400	t
1166	167	4	1.9900	t
1173	168	4	2.0600	t
1180	169	4	2.3300	t
1187	170	4	2.0800	t
1194	171	4	2.2900	t
1201	172	4	1.6800	t
1208	173	4	2.1400	t
1215	174	4	1.6100	t
1222	175	4	2.1600	t
1229	176	4	1.9500	t
1236	177	4	2.1800	t
1243	178	4	2.2900	t
1250	179	4	2.2000	t
1257	180	4	1.6300	t
1264	181	4	2.4500	t
1271	182	4	2.2600	t
1278	183	4	1.5700	t
1285	184	4	2.2800	t
1292	185	4	1.9100	t
1299	186	4	2.3000	t
1306	187	4	2.2500	t
1313	188	4	2.3200	t
1320	189	4	1.5900	t
1327	190	4	2.3400	t
40	6	5	2.5000	t
47	7	5	1.9100	t
54	8	5	2.3200	t
61	9	5	1.7300	t
68	10	5	2.1400	t
75	11	5	1.9300	t
82	12	5	1.8800	t
89	13	5	1.8600	t
96	14	5	2.1700	t
103	15	5	2.3200	t
110	16	5	1.9900	t
117	17	5	1.7800	t
124	18	5	1.8100	t
131	19	5	2.2400	t
138	20	5	1.6300	t
145	21	5	2.1700	t
152	22	5	1.6900	t
159	23	5	1.7800	t
166	24	5	2.0800	t
173	25	5	2.0700	t
180	26	5	2.5400	t
187	27	5	1.8900	t
194	28	5	2.0000	t
201	29	5	1.7100	t
208	30	5	2.4600	t
215	31	5	1.9700	t
222	32	5	1.8600	t
229	33	5	1.9100	t
236	34	5	1.6800	t
243	35	5	2.3000	t
250	36	5	1.9700	t
257	37	5	1.7600	t
264	38	5	1.7900	t
271	39	5	2.2200	t
278	40	5	1.6100	t
285	41	5	1.8900	t
292	42	5	1.6700	t
5	1	5	2.4500	f
26	4	5	1.6800	f
33	5	5	2.0900	f
299	43	5	1.7600	t
306	44	5	2.1300	t
313	45	5	1.5800	t
320	46	5	2.5200	t
327	47	5	1.8700	t
334	48	5	1.9800	t
341	49	5	1.6900	t
348	50	5	2.4400	t
355	51	5	2.0100	t
362	52	5	1.8400	t
369	53	5	1.8900	t
376	54	5	1.6600	t
383	55	5	2.3500	t
390	56	5	2.4800	t
397	57	5	1.7400	t
404	58	5	1.7700	t
411	59	5	2.2000	t
418	60	5	1.5900	t
425	61	5	1.6100	t
432	62	5	1.6500	t
439	63	5	1.7400	t
446	64	5	2.1100	t
453	65	5	1.5600	t
460	66	5	1.5700	t
467	67	5	2.3800	t
474	68	5	1.9600	t
481	69	5	1.6700	t
488	70	5	2.4200	t
495	71	5	2.0500	t
502	72	5	1.8200	t
509	73	5	1.8700	t
516	74	5	1.6400	t
523	75	5	2.3300	t
530	76	5	2.4600	t
537	77	5	1.7900	t
544	78	5	2.2800	t
551	79	5	2.1800	t
558	80	5	1.5700	t
565	81	5	2.3300	t
572	82	5	1.6300	t
579	83	5	1.7200	t
586	84	5	2.0900	t
593	85	5	2.5400	t
600	86	5	1.5500	t
607	87	5	2.3600	t
614	88	5	2.0100	t
621	89	5	2.1800	t
628	90	5	2.4000	t
635	91	5	2.0900	t
642	92	5	1.8000	t
649	93	5	1.8500	t
656	94	5	1.6200	t
663	95	5	2.3100	t
670	96	5	2.4400	t
677	97	5	1.7700	t
684	98	5	2.2600	t
691	99	5	2.2300	t
698	100	5	2.0800	t
705	101	5	2.0500	t
712	102	5	1.6100	t
719	103	5	1.7000	t
726	104	5	2.0700	t
733	105	5	2.5200	t
740	106	5	2.5300	t
747	107	5	2.3400	t
754	108	5	1.9900	t
761	109	5	2.1600	t
768	110	5	1.9800	t
775	111	5	2.1300	t
782	112	5	1.7800	t
789	113	5	1.8300	t
796	114	5	1.6000	t
803	115	5	2.2900	t
810	116	5	2.4200	t
817	117	5	1.7500	t
824	118	5	2.2400	t
831	119	5	1.7400	t
838	120	5	2.1300	t
845	121	5	1.7700	t
852	122	5	1.5900	t
859	123	5	1.6800	t
866	124	5	2.0500	t
873	125	5	2.5000	t
880	126	5	2.5100	t
887	127	5	2.3200	t
894	128	5	2.5000	t
901	129	5	2.2100	t
908	130	5	1.9600	t
915	131	5	2.1700	t
922	132	5	1.7600	t
929	133	5	1.8100	t
936	134	5	1.5800	t
943	135	5	2.2700	t
950	136	5	2.4000	t
957	137	5	2.2600	t
964	138	5	2.2900	t
971	139	5	1.7200	t
978	140	5	2.1100	t
985	141	5	2.4900	t
992	142	5	1.5700	t
999	143	5	1.6600	t
1006	144	5	2.0300	t
1013	145	5	2.4800	t
1020	146	5	2.0200	t
1027	147	5	2.3700	t
1034	148	5	2.4800	t
1041	149	5	2.1900	t
1048	150	5	1.9400	t
1055	151	5	2.2100	t
1062	152	5	1.7400	t
1069	153	5	1.7900	t
1076	154	5	1.5600	t
1083	155	5	1.7800	t
1090	156	5	2.4500	t
1097	157	5	2.2400	t
1104	158	5	2.2700	t
1111	159	5	1.7000	t
1118	160	5	2.0900	t
1125	161	5	2.2100	t
1132	162	5	1.5500	t
1139	163	5	1.6400	t
1146	164	5	2.5400	t
1153	165	5	2.5300	t
1160	166	5	2.0000	t
1167	167	5	2.3500	t
1174	168	5	2.4600	t
1181	169	5	2.1700	t
1188	170	5	1.9200	t
1195	171	5	2.2500	t
1202	172	5	1.7200	t
1209	173	5	2.3000	t
1216	174	5	1.6100	t
1223	175	5	1.7600	t
1230	176	5	2.4300	t
1237	177	5	2.2200	t
1244	178	5	2.2500	t
1251	179	5	1.6800	t
1258	180	5	2.0700	t
1265	181	5	1.9300	t
1272	182	5	2.0600	t
1279	183	5	1.6900	t
1286	184	5	2.5200	t
1293	185	5	2.5100	t
1300	186	5	1.9800	t
1307	187	5	2.3300	t
1314	188	5	2.4400	t
1321	189	5	2.1500	t
1328	190	5	1.9000	t
\.


--
-- Data for Name: posicion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posicion (posicionid, nombre, descripcion, estado) FROM stdin;
1	PORTERO	Jugador encargado principalmente de proteger el arco	t
2	DEFENSA	Jugador enfocado principalmente en tareas defensivas	t
3	MEDIOCAMPISTA	Jugador que participa en la transición entre defensa y ataque	t
4	DELANTERO	Jugador enfocado principalmente en tareas ofensivas	t
\.


--
-- Data for Name: regla; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regla (reglaid, deporteid, nombre, descripcion, tiporegla, estado) FROM stdin;
1	1	Ganador Local	El equipo local gana el partido	RESULTADO_PARTIDO	t
2	1	Empate	El partido termina empatado	RESULTADO_PARTIDO	t
3	1	Ganador Visitante	El equipo visitante gana el partido	RESULTADO_PARTIDO	t
4	1	Más de 2.5 goles	El partido termina con más de 2.5 goles	TOTAL_GOLES	t
5	1	Menos de 2.5 goles	El partido termina con menos de 2.5 goles	TOTAL_GOLES	t
6	1	Ambos equipos marcan - Sí	Los dos equipos anotan al menos un gol	AMBOS_MARCAN	t
7	1	Ambos equipos marcan - No	Al menos uno de los equipos no anota	AMBOS_MARCAN	t
\.


--
-- Data for Name: servicio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.servicio (servicioid, empresaid, nombre, descripcion, estado) FROM stdin;
1	1	Apuestas Deportivas	Servicio de apuestas sobre eventos deportivos de ZonaGol	t
\.


--
-- Data for Name: temporada; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.temporada (temporadaid, ligaid, anio, fechainicio, fechafin, estado) FROM stdin;
1	1	2026	2026-01-01	2026-12-31	t
2	1	2024	2024-01-19	2024-12-22	t
\.


--
-- Data for Name: tipoestadistica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipoestadistica (tipoestadisticaid, nombre, unidad, descripcion, estado) FROM stdin;
1	POSESION	PORCENTAJE	Porcentaje de posesión del balón	t
2	TIROS	CANTIDAD	Cantidad total de tiros	t
3	TIROS_AL_ARCO	CANTIDAD	Cantidad de tiros dirigidos al arco	t
4	CORNERS	CANTIDAD	Cantidad de tiros de esquina	t
5	FALTAS	CANTIDAD	Cantidad de faltas cometidas	t
6	GOLES	CANTIDAD	Cantidad de goles registrados	t
\.


--
-- Data for Name: tipoeventopartido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipoeventopartido (tipoeventopartidoid, nombre, descripcion, estado) FROM stdin;
1	GOL	Gol anotado durante el partido	t
2	TARJETA_AMARILLA	Jugador amonestado con tarjeta amarilla	t
3	TARJETA_ROJA	Jugador expulsado con tarjeta roja	t
4	SUSTITUCION	Cambio de jugador durante el partido	t
\.


--
-- Name: eventopartido_eventopartidoid_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eventopartido_eventopartidoid_seq', 1, false);


--
-- Name: alineacion pk_alineacion; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alineacion
    ADD CONSTRAINT pk_alineacion PRIMARY KEY (alineacionid);


--
-- Name: calendario pk_calendario; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario
    ADD CONSTRAINT pk_calendario PRIMARY KEY (temporadaid, numerojornada);


--
-- Name: configuracionregla pk_configuracionregla; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracionregla
    ADD CONSTRAINT pk_configuracionregla PRIMARY KEY (configuracionreglaid);


--
-- Name: deporte pk_deporte; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deporte
    ADD CONSTRAINT pk_deporte PRIMARY KEY (deporteid);


--
-- Name: equipo pk_equipo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT pk_equipo PRIMARY KEY (equipoid);


--
-- Name: equipoestadio pk_equipoestadio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipoestadio
    ADD CONSTRAINT pk_equipoestadio PRIMARY KEY (equipoestadioid);


--
-- Name: estadio pk_estadio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadio
    ADD CONSTRAINT pk_estadio PRIMARY KEY (estadioid);


--
-- Name: estadisticaequipopartido pk_estadisticaequipopartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticaequipopartido
    ADD CONSTRAINT pk_estadisticaequipopartido PRIMARY KEY (estadisticaequipopartidoid);


--
-- Name: estadisticajugadorpartido pk_estadisticajugadorpartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticajugadorpartido
    ADD CONSTRAINT pk_estadisticajugadorpartido PRIMARY KEY (estadisticajugadorpartidoid);


--
-- Name: estadopartido pk_estadopartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadopartido
    ADD CONSTRAINT pk_estadopartido PRIMARY KEY (estadopartidoid);


--
-- Name: eventopartido pk_eventopartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventopartido
    ADD CONSTRAINT pk_eventopartido PRIMARY KEY (eventopartidoid);


--
-- Name: identificadorexterno pk_identificadorexterno; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadorexterno
    ADD CONSTRAINT pk_identificadorexterno PRIMARY KEY (proveedor, tipoentidad, idexterno);


--
-- Name: jugador pk_jugador; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugador
    ADD CONSTRAINT pk_jugador PRIMARY KEY (jugadorid);


--
-- Name: jugadorequipo pk_jugadorequipo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugadorequipo
    ADD CONSTRAINT pk_jugadorequipo PRIMARY KEY (jugadorequipoid);


--
-- Name: liga pk_liga; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liga
    ADD CONSTRAINT pk_liga PRIMARY KEY (ligaid);


--
-- Name: partido pk_partido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT pk_partido PRIMARY KEY (partidoid);


--
-- Name: partidoregla pk_partidoregla; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidoregla
    ADD CONSTRAINT pk_partidoregla PRIMARY KEY (partidoreglaid);


--
-- Name: posicion pk_posicion; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posicion
    ADD CONSTRAINT pk_posicion PRIMARY KEY (posicionid);


--
-- Name: regla pk_regla; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regla
    ADD CONSTRAINT pk_regla PRIMARY KEY (reglaid);


--
-- Name: servicio pk_servicio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT pk_servicio PRIMARY KEY (servicioid);


--
-- Name: temporada pk_temporada; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT pk_temporada PRIMARY KEY (temporadaid);


--
-- Name: tipoestadistica pk_tipoestadistica; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipoestadistica
    ADD CONSTRAINT pk_tipoestadistica PRIMARY KEY (tipoestadisticaid);


--
-- Name: tipoeventopartido pk_tipoeventopartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipoeventopartido
    ADD CONSTRAINT pk_tipoeventopartido PRIMARY KEY (tipoeventopartidoid);


--
-- Name: alineacion uq_alineacion_partidojugador; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alineacion
    ADD CONSTRAINT uq_alineacion_partidojugador UNIQUE (partidoid, jugadorequipoid);


--
-- Name: configuracionregla uq_configuracionregla; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracionregla
    ADD CONSTRAINT uq_configuracionregla UNIQUE (reglaid, parametro);


--
-- Name: deporte uq_deporte_servicio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deporte
    ADD CONSTRAINT uq_deporte_servicio UNIQUE (servicioid, nombre);


--
-- Name: equipo uq_equipo_liga; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT uq_equipo_liga UNIQUE (ligaid, nombre);


--
-- Name: equipoestadio uq_equipoestadio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipoestadio
    ADD CONSTRAINT uq_equipoestadio UNIQUE (equipoid, estadioid, fechadesde);


--
-- Name: estadisticaequipopartido uq_estadisticaequipopartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticaequipopartido
    ADD CONSTRAINT uq_estadisticaequipopartido UNIQUE (partidoid, equipoid, tipoestadisticaid);


--
-- Name: estadisticajugadorpartido uq_estadisticajugadorpartido; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticajugadorpartido
    ADD CONSTRAINT uq_estadisticajugadorpartido UNIQUE (partidoid, jugadorequipoid, tipoestadisticaid);


--
-- Name: estadopartido uq_estadopartido_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadopartido
    ADD CONSTRAINT uq_estadopartido_nombre UNIQUE (nombre);


--
-- Name: jugadorequipo uq_jugadorequipo; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugadorequipo
    ADD CONSTRAINT uq_jugadorequipo UNIQUE (jugadorid, equipoid, fechadesde);


--
-- Name: liga uq_liga_deporte; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liga
    ADD CONSTRAINT uq_liga_deporte UNIQUE (deporteid, nombre);


--
-- Name: partidoregla uq_partidoregla; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidoregla
    ADD CONSTRAINT uq_partidoregla UNIQUE (partidoid, reglaid);


--
-- Name: posicion uq_posicion_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posicion
    ADD CONSTRAINT uq_posicion_nombre UNIQUE (nombre);


--
-- Name: regla uq_regla_deporte; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regla
    ADD CONSTRAINT uq_regla_deporte UNIQUE (deporteid, nombre);


--
-- Name: servicio uq_servicio_empresa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servicio
    ADD CONSTRAINT uq_servicio_empresa UNIQUE (empresaid, nombre);


--
-- Name: temporada uq_temporada; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT uq_temporada UNIQUE (ligaid, anio);


--
-- Name: tipoestadistica uq_tipoestadistica_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipoestadistica
    ADD CONSTRAINT uq_tipoestadistica_nombre UNIQUE (nombre);


--
-- Name: tipoeventopartido uq_tipoeventopartido_nombre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipoeventopartido
    ADD CONSTRAINT uq_tipoeventopartido_nombre UNIQUE (nombre);


--
-- Name: uq_identificadorexterno_equipo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_identificadorexterno_equipo ON public.identificadorexterno USING btree (proveedor, equipoid) WHERE (equipoid IS NOT NULL);


--
-- Name: uq_identificadorexterno_estadio; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_identificadorexterno_estadio ON public.identificadorexterno USING btree (proveedor, estadioid) WHERE (estadioid IS NOT NULL);


--
-- Name: uq_identificadorexterno_liga; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_identificadorexterno_liga ON public.identificadorexterno USING btree (proveedor, ligaid) WHERE (ligaid IS NOT NULL);


--
-- Name: uq_identificadorexterno_partido; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_identificadorexterno_partido ON public.identificadorexterno USING btree (proveedor, partidoid) WHERE (partidoid IS NOT NULL);


--
-- Name: alineacion fk_alineacion_jugadorequipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alineacion
    ADD CONSTRAINT fk_alineacion_jugadorequipo FOREIGN KEY (jugadorequipoid) REFERENCES public.jugadorequipo(jugadorequipoid);


--
-- Name: alineacion fk_alineacion_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alineacion
    ADD CONSTRAINT fk_alineacion_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: alineacion fk_alineacion_posicion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alineacion
    ADD CONSTRAINT fk_alineacion_posicion FOREIGN KEY (posicionid) REFERENCES public.posicion(posicionid);


--
-- Name: calendario fk_calendario_temporada; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario
    ADD CONSTRAINT fk_calendario_temporada FOREIGN KEY (temporadaid) REFERENCES public.temporada(temporadaid);


--
-- Name: configuracionregla fk_configuracionregla_regla; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracionregla
    ADD CONSTRAINT fk_configuracionregla_regla FOREIGN KEY (reglaid) REFERENCES public.regla(reglaid);


--
-- Name: deporte fk_deporte_servicio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deporte
    ADD CONSTRAINT fk_deporte_servicio FOREIGN KEY (servicioid) REFERENCES public.servicio(servicioid);


--
-- Name: equipo fk_equipo_liga; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT fk_equipo_liga FOREIGN KEY (ligaid) REFERENCES public.liga(ligaid);


--
-- Name: equipoestadio fk_equipoestadio_equipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipoestadio
    ADD CONSTRAINT fk_equipoestadio_equipo FOREIGN KEY (equipoid) REFERENCES public.equipo(equipoid);


--
-- Name: equipoestadio fk_equipoestadio_estadio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipoestadio
    ADD CONSTRAINT fk_equipoestadio_estadio FOREIGN KEY (estadioid) REFERENCES public.estadio(estadioid);


--
-- Name: estadisticaequipopartido fk_estadisticaequipo_equipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticaequipopartido
    ADD CONSTRAINT fk_estadisticaequipo_equipo FOREIGN KEY (equipoid) REFERENCES public.equipo(equipoid);


--
-- Name: estadisticaequipopartido fk_estadisticaequipo_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticaequipopartido
    ADD CONSTRAINT fk_estadisticaequipo_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: estadisticaequipopartido fk_estadisticaequipo_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticaequipopartido
    ADD CONSTRAINT fk_estadisticaequipo_tipo FOREIGN KEY (tipoestadisticaid) REFERENCES public.tipoestadistica(tipoestadisticaid);


--
-- Name: estadisticajugadorpartido fk_estadisticajugador_jugador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticajugadorpartido
    ADD CONSTRAINT fk_estadisticajugador_jugador FOREIGN KEY (jugadorequipoid) REFERENCES public.jugadorequipo(jugadorequipoid);


--
-- Name: estadisticajugadorpartido fk_estadisticajugador_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticajugadorpartido
    ADD CONSTRAINT fk_estadisticajugador_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: estadisticajugadorpartido fk_estadisticajugador_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estadisticajugadorpartido
    ADD CONSTRAINT fk_estadisticajugador_tipo FOREIGN KEY (tipoestadisticaid) REFERENCES public.tipoestadistica(tipoestadisticaid);


--
-- Name: eventopartido fk_eventopartido_equipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventopartido
    ADD CONSTRAINT fk_eventopartido_equipo FOREIGN KEY (equipoid) REFERENCES public.equipo(equipoid);


--
-- Name: eventopartido fk_eventopartido_jugador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventopartido
    ADD CONSTRAINT fk_eventopartido_jugador FOREIGN KEY (jugadorequipoid) REFERENCES public.jugadorequipo(jugadorequipoid);


--
-- Name: eventopartido fk_eventopartido_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventopartido
    ADD CONSTRAINT fk_eventopartido_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: eventopartido fk_eventopartido_tipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eventopartido
    ADD CONSTRAINT fk_eventopartido_tipo FOREIGN KEY (tipoeventopartidoid) REFERENCES public.tipoeventopartido(tipoeventopartidoid);


--
-- Name: identificadorexterno fk_identificadorexterno_equipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadorexterno
    ADD CONSTRAINT fk_identificadorexterno_equipo FOREIGN KEY (equipoid) REFERENCES public.equipo(equipoid);


--
-- Name: identificadorexterno fk_identificadorexterno_estadio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadorexterno
    ADD CONSTRAINT fk_identificadorexterno_estadio FOREIGN KEY (estadioid) REFERENCES public.estadio(estadioid);


--
-- Name: identificadorexterno fk_identificadorexterno_liga; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadorexterno
    ADD CONSTRAINT fk_identificadorexterno_liga FOREIGN KEY (ligaid) REFERENCES public.liga(ligaid);


--
-- Name: identificadorexterno fk_identificadorexterno_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.identificadorexterno
    ADD CONSTRAINT fk_identificadorexterno_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: jugador fk_jugador_posicion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugador
    ADD CONSTRAINT fk_jugador_posicion FOREIGN KEY (posicionid) REFERENCES public.posicion(posicionid);


--
-- Name: jugadorequipo fk_jugadorequipo_equipo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugadorequipo
    ADD CONSTRAINT fk_jugadorequipo_equipo FOREIGN KEY (equipoid) REFERENCES public.equipo(equipoid);


--
-- Name: jugadorequipo fk_jugadorequipo_jugador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jugadorequipo
    ADD CONSTRAINT fk_jugadorequipo_jugador FOREIGN KEY (jugadorid) REFERENCES public.jugador(jugadorid);


--
-- Name: liga fk_liga_deporte; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liga
    ADD CONSTRAINT fk_liga_deporte FOREIGN KEY (deporteid) REFERENCES public.deporte(deporteid);


--
-- Name: partido fk_partido_calendario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT fk_partido_calendario FOREIGN KEY (temporadaid, numerojornada) REFERENCES public.calendario(temporadaid, numerojornada);


--
-- Name: partido fk_partido_equipolocal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT fk_partido_equipolocal FOREIGN KEY (equipolocalid) REFERENCES public.equipo(equipoid);


--
-- Name: partido fk_partido_equipovisitante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT fk_partido_equipovisitante FOREIGN KEY (equipovisitanteid) REFERENCES public.equipo(equipoid);


--
-- Name: partido fk_partido_estadio; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT fk_partido_estadio FOREIGN KEY (estadioid) REFERENCES public.estadio(estadioid);


--
-- Name: partido fk_partido_estado; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partido
    ADD CONSTRAINT fk_partido_estado FOREIGN KEY (estadopartidoid) REFERENCES public.estadopartido(estadopartidoid);


--
-- Name: partidoregla fk_partidoregla_partido; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidoregla
    ADD CONSTRAINT fk_partidoregla_partido FOREIGN KEY (partidoid) REFERENCES public.partido(partidoid);


--
-- Name: partidoregla fk_partidoregla_regla; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.partidoregla
    ADD CONSTRAINT fk_partidoregla_regla FOREIGN KEY (reglaid) REFERENCES public.regla(reglaid);


--
-- Name: regla fk_regla_deporte; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regla
    ADD CONSTRAINT fk_regla_deporte FOREIGN KEY (deporteid) REFERENCES public.deporte(deporteid);


--
-- Name: temporada fk_temporada_liga; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT fk_temporada_liga FOREIGN KEY (ligaid) REFERENCES public.liga(ligaid);


--
-- PostgreSQL database dump complete
--

\unrestrict ltne2ohqUIlvrxhyJNbUFvoVITXv3IOHvRIugp74tyltcx3uQEvfqs237FoYpgl

