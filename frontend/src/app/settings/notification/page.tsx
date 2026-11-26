import AlarmsScreen from '@/features/alarms/AlarmsScreen';

// 화면에만 저장되던 알림 설정을 없애고, 서버에 저장되는 알림 화면 하나로 합쳤다
export default function NotificationSettingsPage() {
    return <AlarmsScreen />;
}
