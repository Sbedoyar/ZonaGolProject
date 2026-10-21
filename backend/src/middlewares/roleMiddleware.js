// ============================================================
// AUTORIZACIÓN POR ROLES
// ============================================================
//
// Debe ejecutarse DESPUÉS de verificarToken.
//
// Ejemplo:
//
// router.get(
//     '/ruta-admin',
//     verificarToken,
//     autorizarRoles(1),
//     controlador
// )
//
// Roles ZonaGol:
// 1 = ADMINISTRADOR
// 2 = OPERADOR
// 3 = CLIENTE
// ============================================================

function autorizarRoles(...rolesPermitidos) {

    return (req, res, next) => {

        // =====================================================
        // COMPROBAR QUE EL TOKEN YA FUE VALIDADO
        // =====================================================

        if (
            !req.usuario ||
            !req.usuario.rolId
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Usuario no autenticado'
            })
        }


        // =====================================================
        // COMPROBAR ROL
        // =====================================================

        const tienePermiso =
            rolesPermitidos.includes(
                req.usuario.rolId
            )


        if (!tienePermiso) {

            return res.status(403).json({
                success: false,
                message:
                    'No tienes permisos para acceder a este recurso'
            })
        }


        // =====================================================
        // ROL AUTORIZADO
        // =====================================================

        next()
    }
}


module.exports = {
    autorizarRoles
}