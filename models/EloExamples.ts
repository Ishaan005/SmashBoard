import { updateElo, ratingToLevel } from './Elo';

/**
 * Example usage of the ELO rating system
 */

// Example 1: Two players with equal ratings
console.log('=== Example 1: Equal Players (1000 vs 1000) ===');
let playerA = { name: 'Alice', rating: 1000 };
let playerB = { name: 'Bob', rating: 1000 };

console.log(`Before match: ${playerA.name}=${playerA.rating} (${ratingToLevel(playerA.rating)}), ${playerB.name}=${playerB.rating} (${ratingToLevel(playerB.rating)})`);

// Alice beats Bob
const [newRatingA, newRatingB] = updateElo(playerA.rating, playerB.rating, 'A', 20);
playerA.rating = newRatingA;
playerB.rating = newRatingB;

console.log(`After Alice wins: ${playerA.name}=${playerA.rating} (${ratingToLevel(playerA.rating)}), ${playerB.name}=${playerB.rating} (${ratingToLevel(playerB.rating)})`);
console.log(`Rating change: Alice +${newRatingA - 1000}, Bob ${newRatingB - 1000}\n`);

// Example 2: Upset victory (lower rated player wins)
console.log('=== Example 2: Upset Victory (1000 vs 1400) ===');
let rookie = { name: 'Rookie', rating: 1000 };
let pro = { name: 'Pro', rating: 1400 };

console.log(`Before match: ${rookie.name}=${rookie.rating} (${ratingToLevel(rookie.rating)}), ${pro.name}=${pro.rating} (${ratingToLevel(pro.rating)})`);

// Rookie beats Pro (upset!)
const [rookieNew, proNew] = updateElo(rookie.rating, pro.rating, 'A', 20);
const rookieGain = rookieNew - rookie.rating;
const proLoss = proNew - pro.rating;

console.log(`After Rookie wins: ${rookie.name}=${rookieNew} (${ratingToLevel(rookieNew)}), ${pro.name}=${proNew} (${ratingToLevel(proNew)})`);
console.log(`Rating change: Rookie +${rookieGain}, Pro ${proLoss}`);
console.log(`Rookie gained ${Math.abs(rookieGain)} points, Pro lost ${Math.abs(proLoss)} points\n`);

// Example 3: Draw scenario
console.log('=== Example 3: Draw (1100 vs 1300) ===');
let player1 = { name: 'Player1', rating: 1100 };
let player2 = { name: 'Player2', rating: 1300 };

console.log(`Before match: ${player1.name}=${player1.rating} (${ratingToLevel(player1.rating)}), ${player2.name}=${player2.rating} (${ratingToLevel(player2.rating)})`);

const [p1New, p2New] = updateElo(player1.rating, player2.rating, 'draw', 20);
console.log(`After draw: ${player1.name}=${p1New} (${ratingToLevel(p1New)}), ${player2.name}=${p2New} (${ratingToLevel(p2New)})`);
console.log(`Rating change: Player1 +${p1New - player1.rating}, Player2 ${p2New - player2.rating}`);

// Example 4: Different K-factors
console.log('\n=== Example 4: K-Factor Impact ===');
const baseA = 1200;
const baseB = 1200;

const [lowK_A, lowK_B] = updateElo(baseA, baseB, 'A', 10);   // Conservative
const [midK_A, midK_B] = updateElo(baseA, baseB, 'A', 20);   // Standard  
const [highK_A, highK_B] = updateElo(baseA, baseB, 'A', 40); // Aggressive

console.log(`With K=10: Winner gets +${lowK_A - baseA}, Loser gets ${lowK_B - baseB}`);
console.log(`With K=20: Winner gets +${midK_A - baseA}, Loser gets ${midK_B - baseB}`);
console.log(`With K=40: Winner gets +${highK_A - baseA}, Loser gets ${highK_B - baseB}`);

export { };