IF DB_ID(N'ZonaGolAuth') IS NULL
BEGIN
    CREATE DATABASE ZonaGolAuth;
END;
GO

USE ZonaGolAuth;
GO


/* ============================================================
   TABLA: Rol
   ============================================================ */

IF OBJECT_ID(N'dbo.Rol', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rol
    (
        RolId INT NOT NULL,
        Nombre NVARCHAR(60) NOT NULL,
        Descripcion NVARCHAR(250) NULL,
        Estado BIT NOT NULL
            CONSTRAINT DF_Rol_Estado DEFAULT ((1)),

        CONSTRAINT PK_Rol
            PRIMARY KEY (RolId),

        CONSTRAINT UQ_Rol_Nombre
            UNIQUE (Nombre)
    );
END;
GO


/* ============================================================
   TABLA: Usuario
   ============================================================ */

IF OBJECT_ID(N'dbo.Usuario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuario
    (
        UsuarioId INT NOT NULL,
        CodigoUsuario VARCHAR(11) NULL,
        RolId INT NOT NULL,
        Correo NVARCHAR(150) NOT NULL,
        Celular VARCHAR(20) NULL,
        FechaRegistro DATETIME2 NOT NULL
            CONSTRAINT DF_Usuario_FechaRegistro DEFAULT (SYSDATETIME()),
        Estado BIT NOT NULL
            CONSTRAINT DF_Usuario_Estado DEFAULT ((1)),
        FotoPerfilDriveId VARCHAR(100) NULL,

        CONSTRAINT PK_Usuario
            PRIMARY KEY (UsuarioId),

        CONSTRAINT UQ_Usuario_Correo
            UNIQUE (Correo),

        CONSTRAINT FK_Usuario_Rol
            FOREIGN KEY (RolId)
            REFERENCES dbo.Rol(RolId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );
END;
GO


/* ============================================================
   TABLA: Login
   ============================================================ */

IF OBJECT_ID(N'dbo.Login', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Login
    (
        UsuarioId INT NOT NULL,
        PasswordHash NVARCHAR(500) NOT NULL,
        IntentosFallidos INT NOT NULL
            CONSTRAINT DF_Login_IntentosFallidos DEFAULT ((0)),
        BloqueadoHasta DATETIME2 NULL,
        UltimoIngreso DATETIME2 NULL,

        CONSTRAINT PK_Login
            PRIMARY KEY (UsuarioId),

        CONSTRAINT CK_Login_Intentos
            CHECK (IntentosFallidos >= 0),

        CONSTRAINT FK_Login_Usuario
            FOREIGN KEY (UsuarioId)
            REFERENCES dbo.Usuario(UsuarioId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );
END;
GO


/* ============================================================
   TABLA: RecuperacionClave
   ============================================================ */

IF OBJECT_ID(N'dbo.RecuperacionClave', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RecuperacionClave
    (
        UsuarioId INT NOT NULL,
        TokenHash NVARCHAR(500) NOT NULL,
        FechaSolicitud DATETIME2 NOT NULL
            CONSTRAINT DF_RecuperacionClave_FechaSolicitud
            DEFAULT (SYSDATETIME()),
        FechaExpiracion DATETIME2 NOT NULL,
        FechaUso DATETIME2 NULL,
        FechaRevocacion DATETIME2 NULL,

        CONSTRAINT PK_RecuperacionClave
            PRIMARY KEY (UsuarioId, FechaSolicitud),

        CONSTRAINT CK_RecuperacionClave_Expiracion
            CHECK (FechaExpiracion > FechaSolicitud),

        CONSTRAINT FK_RecuperacionClave_Login
            FOREIGN KEY (UsuarioId)
            REFERENCES dbo.Login(UsuarioId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );
END;
GO


/* ============================================================
   TABLA: IdentidadExterna
   ============================================================ */

IF OBJECT_ID(N'dbo.IdentidadExterna', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdentidadExterna
    (
        Proveedor VARCHAR(30) NOT NULL,
        ProveedorUsuarioId NVARCHAR(255) NOT NULL,
        UsuarioId INT NOT NULL,
        FechaVinculacion DATETIME2 NOT NULL
            CONSTRAINT DF_IdentidadExterna_FechaVinculacion
            DEFAULT (SYSDATETIME()),
        UltimoIngreso DATETIME2 NULL,
        Estado BIT NOT NULL
            CONSTRAINT DF_IdentidadExterna_Estado DEFAULT ((1)),

        CONSTRAINT PK_IdentidadExterna
            PRIMARY KEY (Proveedor, ProveedorUsuarioId),

        CONSTRAINT UQ_IdentidadExterna_Usuario_Proveedor
            UNIQUE (UsuarioId, Proveedor),

        CONSTRAINT FK_IdentidadExterna_Usuario
            FOREIGN KEY (UsuarioId)
            REFERENCES dbo.Usuario(UsuarioId)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    );
END;
GO


/* ============================================================
   DATOS DE CATÁLOGO SEGUROS
   ============================================================ */

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Rol
    WHERE RolId = 1
)
BEGIN
    INSERT INTO dbo.Rol
        (RolId, Nombre, Descripcion, Estado)
    VALUES
        (1, N'ADMINISTRADOR',
         N'Administrador general de la plataforma', 1);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Rol
    WHERE RolId = 2
)
BEGIN
    INSERT INTO dbo.Rol
        (RolId, Nombre, Descripcion, Estado)
    VALUES
        (2, N'OPERADOR',
         N'Empleado encargado de la operación de apuestas', 1);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.Rol
    WHERE RolId = 3
)
BEGIN
    INSERT INTO dbo.Rol
        (RolId, Nombre, Descripcion, Estado)
    VALUES
        (3, N'CLIENTE',
         N'Usuario que realiza apuestas en la plataforma', 1);
END;
GO