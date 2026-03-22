jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      firebaseApiKey: 'test-api-key',
      firebaseAuthDomain: 'test.firebaseapp.com',
      firebaseProjectId: 'test-project',
      firebaseStorageBucket: 'test.appspot.com',
      firebaseMessagingSenderId: '123456',
      firebaseAppId: '1:123456:ios:abc',
    },
  },
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ name: 'test-app' })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({ type: 'firestore' })),
}));

describe('Firebase 초기화', () => {
  it('Firebase가 정상적으로 초기화된다', () => {
    const { initializeApp } = require('firebase/app');
    const { getFirestore } = require('firebase/firestore');

    require('@/services/firebase');

    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456',
      appId: '1:123456:ios:abc',
    });

    expect(getFirestore).toHaveBeenCalled();
  });
});
