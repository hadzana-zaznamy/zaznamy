// index.js - Hádzaná záznamy

document.addEventListener('DOMContentLoaded', inicializujAplikaciu);

function inicializujAplikaciu() {
    const app = {
        zaznamy: [],
        aktualnyZaznam: null,
        
        pridajZaznam: function(data) {
            this.zaznamy.push(data);
            this.aktualizujZoznam();
        },
        
        odstranZaznam: function(index) {
            if (index >= 0 && index < this.zaznamy.length) {
                this.zaznamy.splice(index, 1);
                this.aktualizujZoznam();
            }
        },
        
        aktualizujZoznam: function() {
            // Tu neskôr pridáme vykreslenie zoznamu
        }
    };
    
    window.app = app;
}

function formatujDatum(datum) {
    const d = new Date(datum);
    return d.toLocaleDateString('sk-SK');
}

function validujCislo(hodnota) {
    return !isNaN(parseFloat(hodnota)) && isFinite(hodnota);
}
