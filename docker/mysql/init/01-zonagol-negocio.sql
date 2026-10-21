-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: zonagol_negocio
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `zonagol_negocio`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `zonagol_negocio` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `zonagol_negocio`;

--
-- Table structure for table `apuesta`
--

DROP TABLE IF EXISTS `apuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apuesta` (
  `ApuestaId` bigint NOT NULL AUTO_INCREMENT,
  `CodigoApuesta` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ClienteUsuarioId` int NOT NULL,
  `EstadoApuestaId` int NOT NULL,
  `FechaApuesta` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `MontoApostado` decimal(19,4) NOT NULL,
  PRIMARY KEY (`ApuestaId`),
  UNIQUE KEY `UQ_Apuesta_Codigo` (`CodigoApuesta`),
  KEY `FK_Apuesta_Cliente` (`ClienteUsuarioId`),
  KEY `FK_Apuesta_Estado` (`EstadoApuestaId`),
  CONSTRAINT `FK_Apuesta_Cliente` FOREIGN KEY (`ClienteUsuarioId`) REFERENCES `cliente` (`UsuarioId`),
  CONSTRAINT `FK_Apuesta_Estado` FOREIGN KEY (`EstadoApuestaId`) REFERENCES `estadoapuesta` (`EstadoApuestaId`),
  CONSTRAINT `CK_Apuesta_Monto` CHECK ((`MontoApostado` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apuesta`
--

LOCK TABLES `apuesta` WRITE;
/*!40000 ALTER TABLE `apuesta` DISABLE KEYS */;
/*!40000 ALTER TABLE `apuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo`
--

DROP TABLE IF EXISTS `cargo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cargo` (
  `CargoId` int NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`CargoId`),
  UNIQUE KEY `UQ_Cargo_Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo`
--

LOCK TABLES `cargo` WRITE;
/*!40000 ALTER TABLE `cargo` DISABLE KEYS */;
/*!40000 ALTER TABLE `cargo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `UsuarioId` int NOT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PrimerNombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoNombre` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoApellido` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaNacimiento` date NOT NULL,
  PRIMARY KEY (`UsuarioId`),
  UNIQUE KEY `UQ_Cliente_Documento` (`NumeroDocumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalleapuesta`
--

DROP TABLE IF EXISTS `detalleapuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalleapuesta` (
  `DetalleApuestaId` bigint NOT NULL AUTO_INCREMENT,
  `ApuestaId` bigint NOT NULL,
  `PartidoReglaId` int NOT NULL,
  `EstadoDetalleApuestaId` int NOT NULL,
  `CuotaAceptada` decimal(10,4) NOT NULL,
  PRIMARY KEY (`DetalleApuestaId`),
  UNIQUE KEY `UQ_DetalleApuesta_Seleccion` (`ApuestaId`,`PartidoReglaId`),
  KEY `FK_DetalleApuesta_Estado` (`EstadoDetalleApuestaId`),
  CONSTRAINT `FK_DetalleApuesta_Apuesta` FOREIGN KEY (`ApuestaId`) REFERENCES `apuesta` (`ApuestaId`),
  CONSTRAINT `FK_DetalleApuesta_Estado` FOREIGN KEY (`EstadoDetalleApuestaId`) REFERENCES `estadodetalleapuesta` (`EstadoDetalleApuestaId`),
  CONSTRAINT `CK_DetalleApuesta_Cuota` CHECK ((`CuotaAceptada` > 1))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalleapuesta`
--

LOCK TABLES `detalleapuesta` WRITE;
/*!40000 ALTER TABLE `detalleapuesta` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalleapuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalleempresa`
--

DROP TABLE IF EXISTS `detalleempresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalleempresa` (
  `EmpresaId` int NOT NULL,
  `Correo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Ciudad` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`EmpresaId`),
  CONSTRAINT `FK_DetalleEmpresa_Empresa` FOREIGN KEY (`EmpresaId`) REFERENCES `empresa` (`EmpresaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalleempresa`
--

LOCK TABLES `detalleempresa` WRITE;
/*!40000 ALTER TABLE `detalleempresa` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalleempresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empleado`
--

DROP TABLE IF EXISTS `empleado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado` (
  `UsuarioId` int NOT NULL,
  `EmpresaId` int NOT NULL,
  `CargoId` int NOT NULL,
  `PrimerNombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoNombre` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoApellido` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FechaContratacion` date NOT NULL,
  PRIMARY KEY (`UsuarioId`),
  UNIQUE KEY `UQ_Empleado_Documento` (`NumeroDocumento`),
  KEY `FK_Empleado_Empresa` (`EmpresaId`),
  KEY `FK_Empleado_Cargo` (`CargoId`),
  CONSTRAINT `FK_Empleado_Cargo` FOREIGN KEY (`CargoId`) REFERENCES `cargo` (`CargoId`),
  CONSTRAINT `FK_Empleado_Empresa` FOREIGN KEY (`EmpresaId`) REFERENCES `empresa` (`EmpresaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empleado`
--

LOCK TABLES `empleado` WRITE;
/*!40000 ALTER TABLE `empleado` DISABLE KEYS */;
/*!40000 ALTER TABLE `empleado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresa`
--

DROP TABLE IF EXISTS `empresa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresa` (
  `EmpresaId` int NOT NULL,
  `CodigoEmpresa` varchar(22) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (concat(_utf8mb4'EM',`EmpresaId`)) STORED,
  `NIT` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RazonSocial` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NombreComercial` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`EmpresaId`),
  UNIQUE KEY `UQ_Empresa_NIT` (`NIT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresa`
--

LOCK TABLES `empresa` WRITE;
/*!40000 ALTER TABLE `empresa` DISABLE KEYS */;
INSERT INTO `empresa` (`EmpresaId`, `NIT`, `RazonSocial`, `NombreComercial`) VALUES (1,'900000000-0','ZonaGol S.A.S.','ZonaGol');
/*!40000 ALTER TABLE `empresa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estadoapuesta`
--

DROP TABLE IF EXISTS `estadoapuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadoapuesta` (
  `EstadoApuestaId` int NOT NULL,
  `Nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`EstadoApuestaId`),
  UNIQUE KEY `UQ_EstadoApuesta_Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadoapuesta`
--

LOCK TABLES `estadoapuesta` WRITE;
/*!40000 ALTER TABLE `estadoapuesta` DISABLE KEYS */;
INSERT INTO `estadoapuesta` VALUES (1,'PENDIENTE','La apuesta todavÃ­a tiene eventos sin resolver'),(2,'GANADA','Todos los resultados necesarios permiten pagar la apuesta'),(3,'PERDIDA','La apuesta fue perdida'),(4,'ANULADA','La apuesta fue anulada');
/*!40000 ALTER TABLE `estadoapuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estadodetalleapuesta`
--

DROP TABLE IF EXISTS `estadodetalleapuesta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadodetalleapuesta` (
  `EstadoDetalleApuestaId` int NOT NULL,
  `Nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`EstadoDetalleApuestaId`),
  UNIQUE KEY `UQ_EstadoDetalleApuesta_Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadodetalleapuesta`
--

LOCK TABLES `estadodetalleapuesta` WRITE;
/*!40000 ALTER TABLE `estadodetalleapuesta` DISABLE KEYS */;
INSERT INTO `estadodetalleapuesta` VALUES (1,'PENDIENTE','La selecciÃ³n todavÃ­a no ha sido resuelta'),(2,'GANADA','La selecciÃ³n fue acertada'),(3,'PERDIDA','La selecciÃ³n no fue acertada'),(4,'ANULADA','La selecciÃ³n fue anulada');
/*!40000 ALTER TABLE `estadodetalleapuesta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estadopago`
--

DROP TABLE IF EXISTS `estadopago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estadopago` (
  `EstadoPagoId` int NOT NULL,
  `Nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`EstadoPagoId`),
  UNIQUE KEY `UQ_EstadoPago_Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estadopago`
--

LOCK TABLES `estadopago` WRITE;
/*!40000 ALTER TABLE `estadopago` DISABLE KEYS */;
INSERT INTO `estadopago` VALUES (1,'PENDIENTE','El pago fue creado pero todavÃ­a no ha sido confirmado'),(2,'APROBADO','El pago fue aprobado por la pasarela'),(3,'RECHAZADO','El pago fue rechazado'),(4,'ANULADO','El pago fue anulado');
/*!40000 ALTER TABLE `estadopago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metodopago`
--

DROP TABLE IF EXISTS `metodopago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodopago` (
  `MetodoPagoId` int NOT NULL,
  `Nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`MetodoPagoId`),
  UNIQUE KEY `UQ_MetodoPago_Nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metodopago`
--

LOCK TABLES `metodopago` WRITE;
/*!40000 ALTER TABLE `metodopago` DISABLE KEYS */;
INSERT INTO `metodopago` VALUES (1,'PSE','Pago mediante PSE',1),(2,'NEQUI','Pago mediante Nequi',1),(3,'PAYPAL','Pago mediante PayPal',1),(4,'TARJETA','Pago mediante tarjeta dÃ©bito o crÃ©dito',1);
/*!40000 ALTER TABLE `metodopago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientosaldo`
--

DROP TABLE IF EXISTS `movimientosaldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientosaldo` (
  `MovimientoSaldoId` bigint NOT NULL AUTO_INCREMENT,
  `UsuarioId` int NOT NULL,
  `TipoMovimientoSaldoId` int NOT NULL,
  `PagoId` bigint DEFAULT NULL,
  `ApuestaId` bigint DEFAULT NULL,
  `Monto` decimal(19,4) NOT NULL,
  `FechaHora` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`MovimientoSaldoId`),
  KEY `FK_MovimientoSaldo_Saldo` (`UsuarioId`),
  KEY `FK_MovimientoSaldo_Tipo` (`TipoMovimientoSaldoId`),
  KEY `FK_MovimientoSaldo_Pago` (`PagoId`),
  KEY `FK_MovimientoSaldo_Apuesta` (`ApuestaId`),
  CONSTRAINT `FK_MovimientoSaldo_Apuesta` FOREIGN KEY (`ApuestaId`) REFERENCES `apuesta` (`ApuestaId`),
  CONSTRAINT `FK_MovimientoSaldo_Pago` FOREIGN KEY (`PagoId`) REFERENCES `pago` (`PagoId`),
  CONSTRAINT `FK_MovimientoSaldo_Saldo` FOREIGN KEY (`UsuarioId`) REFERENCES `saldo` (`UsuarioId`),
  CONSTRAINT `FK_MovimientoSaldo_Tipo` FOREIGN KEY (`TipoMovimientoSaldoId`) REFERENCES `tipomovimientosaldo` (`TipoMovimientoSaldoId`),
  CONSTRAINT `CK_MovimientoSaldo_Monto` CHECK ((`Monto` > 0)),
  CONSTRAINT `CK_MovimientoSaldo_Origen` CHECK (((`PagoId` is null) or (`ApuestaId` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientosaldo`
--

LOCK TABLES `movimientosaldo` WRITE;
/*!40000 ALTER TABLE `movimientosaldo` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimientosaldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago`
--

DROP TABLE IF EXISTS `pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pago` (
  `PagoId` bigint NOT NULL AUTO_INCREMENT,
  `CodigoPago` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ClienteUsuarioId` int NOT NULL,
  `MetodoPagoId` int NOT NULL,
  `EstadoPagoId` int NOT NULL,
  `Monto` decimal(19,4) NOT NULL,
  `ReferenciaTransaccion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaCreacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`PagoId`),
  UNIQUE KEY `UQ_Pago_Codigo` (`CodigoPago`),
  UNIQUE KEY `UQ_Pago_Referencia` (`ReferenciaTransaccion`),
  KEY `FK_Pago_Cliente` (`ClienteUsuarioId`),
  KEY `FK_Pago_Metodo` (`MetodoPagoId`),
  KEY `FK_Pago_Estado` (`EstadoPagoId`),
  CONSTRAINT `FK_Pago_Cliente` FOREIGN KEY (`ClienteUsuarioId`) REFERENCES `cliente` (`UsuarioId`),
  CONSTRAINT `FK_Pago_Estado` FOREIGN KEY (`EstadoPagoId`) REFERENCES `estadopago` (`EstadoPagoId`),
  CONSTRAINT `FK_Pago_Metodo` FOREIGN KEY (`MetodoPagoId`) REFERENCES `metodopago` (`MetodoPagoId`),
  CONSTRAINT `CK_Pago_Monto` CHECK ((`Monto` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago`
--

LOCK TABLES `pago` WRITE;
/*!40000 ALTER TABLE `pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representantelegal`
--

DROP TABLE IF EXISTS `representantelegal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representantelegal` (
  `RepresentanteLegalId` int NOT NULL,
  `EmpresaId` int NOT NULL,
  `PrimerNombre` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoNombre` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoApellido` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FechaInicio` date NOT NULL,
  `FechaFin` date DEFAULT NULL,
  PRIMARY KEY (`RepresentanteLegalId`),
  UNIQUE KEY `UQ_RepresentanteLegal_Documento` (`NumeroDocumento`),
  KEY `FK_RepresentanteLegal_Empresa` (`EmpresaId`),
  CONSTRAINT `FK_RepresentanteLegal_Empresa` FOREIGN KEY (`EmpresaId`) REFERENCES `empresa` (`EmpresaId`),
  CONSTRAINT `CK_RepresentanteLegal_Fechas` CHECK (((`FechaFin` is null) or (`FechaFin` >= `FechaInicio`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representantelegal`
--

LOCK TABLES `representantelegal` WRITE;
/*!40000 ALTER TABLE `representantelegal` DISABLE KEYS */;
/*!40000 ALTER TABLE `representantelegal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saldo`
--

DROP TABLE IF EXISTS `saldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saldo` (
  `UsuarioId` int NOT NULL,
  `SaldoDisponible` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `SaldoRetenido` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `FechaActualizacion` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`UsuarioId`),
  CONSTRAINT `FK_Saldo_Cliente` FOREIGN KEY (`UsuarioId`) REFERENCES `cliente` (`UsuarioId`),
  CONSTRAINT `CK_Saldo_Disponible` CHECK ((`SaldoDisponible` >= 0)),
  CONSTRAINT `CK_Saldo_Retenido` CHECK ((`SaldoRetenido` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saldo`
--

LOCK TABLES `saldo` WRITE;
/*!40000 ALTER TABLE `saldo` DISABLE KEYS */;
/*!40000 ALTER TABLE `saldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipomovimientosaldo`
--

DROP TABLE IF EXISTS `tipomovimientosaldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipomovimientosaldo` (
  `TipoMovimientoSaldoId` int NOT NULL,
  `Nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Naturaleza` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`TipoMovimientoSaldoId`),
  UNIQUE KEY `UQ_TipoMovimientoSaldo_Nombre` (`Nombre`),
  CONSTRAINT `CK_TipoMovimiento_Naturaleza` CHECK ((`Naturaleza` in (_utf8mb4'ENTRADA',_utf8mb4'SALIDA')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipomovimientosaldo`
--

LOCK TABLES `tipomovimientosaldo` WRITE;
/*!40000 ALTER TABLE `tipomovimientosaldo` DISABLE KEYS */;
INSERT INTO `tipomovimientosaldo` VALUES (1,'RECARGA','Ingreso de dinero al saldo del cliente','ENTRADA'),(2,'PREMIO','Dinero recibido por una apuesta ganada','ENTRADA'),(3,'REEMBOLSO','DevoluciÃ³n de dinero al cliente','ENTRADA'),(4,'APUESTA','Dinero utilizado para realizar una apuesta','SALIDA'),(5,'RETIRO','Retiro de dinero realizado por el cliente','SALIDA');
/*!40000 ALTER TABLE `tipomovimientosaldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'zonagol_negocio'
--

--
-- Dumping routines for database 'zonagol_negocio'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-11 19:53:24
