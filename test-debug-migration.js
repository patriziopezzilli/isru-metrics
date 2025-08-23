// Test rapido per verificare la migrazione
console.log('=== MIGRATION DEBUG TEST ===');

// Simuliamo i dati di test
localStorage.setItem('isru-username', 'test-user-migration');
localStorage.setItem('friends-league', JSON.stringify({test: 'data'}));

// Rimuoviamo il flag di migrazione completata per forzare una nuova migrazione
localStorage.removeItem('auto-migration-completed');

// Aggiungiamo il flag per testing locale
localStorage.setItem('test-migration-flow', 'true');

console.log('✅ Test data setup:');
console.log('- isru-username:', localStorage.getItem('isru-username'));
console.log('- friends-league:', localStorage.getItem('friends-league'));
console.log('- test-migration-flow:', localStorage.getItem('test-migration-flow'));
console.log('- auto-migration-completed:', localStorage.getItem('auto-migration-completed'));

// Ora controlla se dovrebbe migrare
console.log('=== CHECKING SHOULDMIGRATE ===');

// Chiama la funzione (devi copiare il codice dal MigrationService)
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
console.log('- Is local environment:', isLocal);

if (isLocal) {
    const forceTestMigration = localStorage.getItem('test-migration-flow') === 'true';
    const hasUsername = localStorage.getItem('isru-username') !== null;
    const notCompleted = localStorage.getItem('auto-migration-completed') !== 'true';
    
    console.log('- Force test migration:', forceTestMigration);
    console.log('- Has username:', hasUsername);
    console.log('- Not completed:', notCompleted);
    console.log('- Should migrate:', forceTestMigration && hasUsername && notCompleted);
}

console.log('=== END TEST ===');
