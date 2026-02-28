class PokerOddsCalculator {
  constructor(deckSize = 52) {
    this.suits = ['h', 'd', 'c', 's'];
    this.ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
    this.deckSize = deckSize;
  }

  // Genera un mazo completo
  generateDeck() {
    const deck = [];
    for (const r of this.ranks) {
      for (const s of this.suits) {
        deck.push(r + s);
      }
    }
    return deck;
  }

  // Elimina cartas usadas del mazo
  removeUsedCards(deck, usedCards) {
    return deck.filter(c => !usedCards.includes(c));
  }

  // Evalúa la categoría de la mano (simplificado, puedes integrar tu evaluator completo)
  evaluateHand(hand) {
    // Aquí debes usar tu lógica de evaluación completa o librería
    // Por simplicidad, devolveremos un número al azar para ejemplo
    // 0 = High Card, 1 = Pair, ..., 9 = Royal Flush
    return Math.floor(Math.random() * 10);
  }

  // Calcula probabilidades usando Monte Carlo
  calculateOdds(playerHands, boardCards = [], simulations = 10000) {
    let deck = this.generateDeck();
    const usedCards = [...boardCards, ...playerHands.flat()];
    deck = this.removeUsedCards(deck, usedCards);

    const wins = Array(playerHands.length).fill(0);
    let ties = 0;

    for (let i = 0; i < simulations; i++) {
      const shuffled = deck.sort(() => Math.random() - 0.5);

      // Completa el board hasta 5 cartas
      const simBoard = [...boardCards];
      while (simBoard.length < 5) simBoard.push(shuffled.pop());

      // Evalúa manos
      const handValues = playerHands.map(hand =>
        this.evaluateHand([...hand, ...simBoard])
      );

      const maxValue = Math.max(...handValues);
      const winners = handValues
        .map((v, idx) => (v === maxValue ? idx : -1))
        .filter(idx => idx !== -1);

      if (winners.length === 1) wins[winners[0]]++;
      else ties++;
    }

    return {
      winProbabilities: wins.map(w => w / simulations),
      tieProbability: ties / simulations
    };
  }
}

module.exports = PokerOddsCalculator;