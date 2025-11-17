import { IEvaluator } from './evaluatorInterface';
import { RuleBasedEvaluator } from './ruleBasedEvaluator';
import { AIEvaluator } from './aiEvaluator';
import { getConfig } from '../../config/environment';
import { logger } from '../../config/logger';

/**
 * Factory function to create appropriate evaluator based on configuration
 * @returns IEvaluator instance (RuleBasedEvaluator or AIEvaluator)
 */
export function createEvaluator(): IEvaluator {
  const config = getConfig();
  const evaluatorType = config.EVALUATOR_TYPE;

  logger.info('Creating evaluator', { type: evaluatorType });

  switch (evaluatorType) {
    case 'ai':
      logger.info('Initializing AI-based evaluator');
      return new AIEvaluator();

    case 'rule-based':
      logger.info('Initializing rule-based evaluator');
      return new RuleBasedEvaluator();

    default:
      logger.warn(`Unknown evaluator type: ${evaluatorType}, defaulting to rule-based`);
      return new RuleBasedEvaluator();
  }
}

/**
 * Singleton instance of evaluator
 * Cached to avoid recreating on every request
 */
let evaluatorInstance: IEvaluator | null = null;

/**
 * Get or create evaluator instance (singleton pattern)
 * @returns Cached or new IEvaluator instance
 */
export function getEvaluator(): IEvaluator {
  if (!evaluatorInstance) {
    evaluatorInstance = createEvaluator();
  }
  return evaluatorInstance;
}

/**
 * Reset evaluator instance (useful for testing or config changes)
 */
export function resetEvaluator(): void {
  evaluatorInstance = null;
  logger.info('Evaluator instance reset');
}
