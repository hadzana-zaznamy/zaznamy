// index.js - Hádzaná záznamy

// Počkám, kým sa dokument úplne načíta
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplikácia Hádzaná záznamy spustená');
    
    // Tu budeme neskôr pridávať funkcionalitu
    inicializujAplikaciu();
});

function inicializujAplikaciu() {
    // Základná štruktúra aplikácie
    const app = {
        zaznamy: [],
        aktualnyZaznam: null,
        
        // Metódy pre prácu so záznamami
        pridajZaznam: function(data) {
            this.zaznamy.push(data);
            console.log('Pridaný záznam:', data);
            this.aktualizujZoznam();
        },
        
        odstranZaznam: function(index) {
            if (index >= 0 && index < this.zaznamy.length) {
                this.zaznamy.splice(index, 1);
                console.log('Odstránený záznam na pozícii:', index);
                this.aktualizujZoznam();
            }
        },
        
        aktualizujZoznam: function() {
            console.log('Aktuálny počet záznamov:', this.zaznamy.length);
            // Tu neskôr pridáme vykreslenie zoznamu
        }
    };
    
    // Pridám niekoľko testovacích záznamov
    app.pridajZaznam({ 
        id: 1, 
        nazov: 'Zápas 1', 
        datum: '2026-07-14', 
        skore: '25:22' 
    });
    
    app.pridajZaznam({ 
        id: 2, 
        nazov: 'Zápas 2', 
        datum: '2026-07-15', 
        skore: '28:24' 
    });
    
    // Vrátim aplikáciu pre prípadné ďalšie použitie
    window.app = app;
}

// Pomocné funkcie
function formatujDatum(datum) {
    const d = new Date(datum);
    return d.toLocaleDateString('sk-SK');
}

function validujCislo(hodnota) {
    return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
