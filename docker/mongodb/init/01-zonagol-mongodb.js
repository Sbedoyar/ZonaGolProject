const dbz = db.getSiblingDB("zonagol");

if (!dbz.getCollectionNames().includes("historial_acceso")) {
    dbz.createCollection("historial_acceso");
}

if (!dbz.getCollectionNames().includes("historial_actividad")) {
    dbz.createCollection("historial_actividad");
}
