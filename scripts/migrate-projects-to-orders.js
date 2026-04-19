// Migration Script: Convert Projects to Orders with Parts
// Run this script in browser console after logging in

async function migrateProjectsToOrders() {
    try {
        const { db, auth } = await getFirebase();
        const user = auth.currentUser;
        
        if (!user) {
            alert('Please log in first');
            return;
        }
        
        const uid = user.uid;
        console.log('Starting migration for user:', uid);
        
        // Get all projects
        const projectsSnapshot = await db.ref(`users/${uid}/projects`).once('value');
        const projects = projectsSnapshot.val();
        
        if (!projects) {
            console.log('No projects found to migrate');
            return;
        }
        
        console.log(`Found ${Object.keys(projects).length} projects to migrate`);
        
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const [projectId, project] of Object.entries(projects)) {
            try {
                console.log(`Migrating project: ${project.name}`);
                
                // Create order from project
                const orderId = db.ref(`users/${uid}/orders`).push().key;
                const orderData = {
                    name: project.name,
                    clientName: '',
                    createdAt: project.createdAt || Date.now(),
                    status: 'pending',
                    totalCost: project.totalCost || 0
                };
                
                await db.ref(`users/${uid}/orders/${orderId}`).set(orderData);
                
                // Create single part from project parameters
                const partId = db.ref(`users/${uid}/orders/${orderId}/parts`).push().key;
                const partData = {
                    name: 'Деталь 1',
                    printType: project.printType || 'fdm',
                    quantity: project.quantity || 1,
                    printerCount: project.printerCount || 1,
                    printerId: project.printerId || '',
                    materialId: project.materialId || '',
                    filamentType: project.filamentType || 'pla',
                    filamentCost: project.filamentCost || 2000,
                    partWeight: project.partWeight || 100,
                    resinCost: project.resinCost || 3000,
                    partVolume: project.partVolume || 50,
                    printHours: project.printHours || 3,
                    printMinutes: project.printMinutes || 0,
                    electricityCost: project.electricityCost || 5.47,
                    printerWattage: project.printerWattage || 300,
                    laborHourlyRate: project.laborHourlyRate || 500,
                    postProcessingHours: project.postProcessingHours || 1,
                    dremelWearLevel: project.dremelWearLevel || 'light',
                    dremelConsumables: project.dremelConsumables || 0,
                    paintingEnabled: project.paintingEnabled || false,
                    paintingTime: project.paintingTime || 1,
                    compressorPower: project.compressorPower || 500,
                    paintChemistry: project.paintChemistry || 50,
                    paintArea: project.paintArea || 100,
                    failureRate: project.failureRate || 10,
                    complexity: project.complexity || 1.0,
                    estimatedCost: project.totalCost || 0
                };
                
                await db.ref(`users/${uid}/orders/${orderId}/parts/${partId}`).set(partData);
                
                console.log(`✓ Migrated: ${project.name} -> Order ${orderId}`);
                migratedCount++;
                
            } catch (error) {
                console.error(`✗ Error migrating project ${project.name}:`, error);
                errorCount++;
            }
        }
        
        console.log(`\nMigration complete:`);
        console.log(`✓ Successfully migrated: ${migratedCount}`);
        console.log(`✗ Errors: ${errorCount}`);
        
        if (migratedCount > 0) {
            alert(`Миграция завершена! Успешно: ${migratedCount}, Ошибок: ${errorCount}. Обновите страницу.`);
        }
        
    } catch (error) {
        console.error('Migration error:', error);
        alert('Ошибка миграции: ' + error.message);
    }
}

// Run migration
migrateProjectsToOrders();
