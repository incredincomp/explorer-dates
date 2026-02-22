// Onboarding logic implementation chunk
const { OnboardingManager } = require('../onboarding');

module.exports = {
    OnboardingManager,
    createOnboardingManager: (context) => new OnboardingManager(context)
};