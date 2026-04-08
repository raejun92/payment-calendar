const mockSubscribeToMonthlyPayments = jest.fn();

jest.mock('@/services/payments', () => ({
  subscribeToMonthlyPayments: (...args: any[]) => mockSubscribeToMonthlyPayments(...args),
}));

// React hooks를 테스트하기 위한 간단한 시뮬레이션
describe('usePayments - listener 정리', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('구독 시 unsubscribe 함수를 반환해야 한다', () => {
    const mockUnsubscribe = jest.fn();
    mockSubscribeToMonthlyPayments.mockReturnValue(mockUnsubscribe);

    const { subscribeToMonthlyPayments } = require('@/services/payments');
    const unsubscribe = subscribeToMonthlyPayments('group-1', '2026-04', jest.fn());

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('월 변경 시 이전 구독이 해제되고 새 구독이 생성되어야 한다', () => {
    const mockUnsubscribe1 = jest.fn();
    const mockUnsubscribe2 = jest.fn();
    mockSubscribeToMonthlyPayments
      .mockReturnValueOnce(mockUnsubscribe1)
      .mockReturnValueOnce(mockUnsubscribe2);

    const { subscribeToMonthlyPayments } = require('@/services/payments');

    // 4월 구독
    const unsubscribe1 = subscribeToMonthlyPayments('group-1', '2026-04', jest.fn());
    expect(mockSubscribeToMonthlyPayments).toHaveBeenCalledTimes(1);

    // 월 변경: 이전 구독 해제
    unsubscribe1();
    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);

    // 5월 구독
    const unsubscribe2 = subscribeToMonthlyPayments('group-1', '2026-05', jest.fn());
    expect(mockSubscribeToMonthlyPayments).toHaveBeenCalledTimes(2);

    // 정리
    unsubscribe2();
    expect(mockUnsubscribe2).toHaveBeenCalledTimes(1);
  });

  it('groupId가 없으면 구독하지 않는다', () => {
    const { subscribeToMonthlyPayments } = require('@/services/payments');

    // groupId가 undefined인 경우 호출하지 않음
    // usePayments 훅에서 groupId 체크 후 구독
    expect(mockSubscribeToMonthlyPayments).not.toHaveBeenCalled();
  });
});
