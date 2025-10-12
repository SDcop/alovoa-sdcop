// utils/timeUtils.js
import * as I18N from "../i18n";
const i18n = I18N.getI18n()
export const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    // 今天内的消息显示时间
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString({
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 昨天的消息
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return `${i18n.t('time.yesterday')} ${date.toLocaleTimeString({
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    // 一周内的消息
    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
        const weekdays = [i18n.t('time.weekdays.sunday'),
            i18n.t('time.weekdays.monday'),
            i18n.t('time.weekdays.tuesday'),
            i18n.t('time.weekdays.wednesday'),
            i18n.t('time.weekdays.thursday'),
            i18n.t('time.weekdays.friday'),
            i18n.t('time.weekdays.saturday')];
        return `${weekdays[date.getDay()]} ${date.toLocaleTimeString({
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }

    // 更早的消息
    return date.toLocaleDateString({
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatDividerTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
        return i18n.t('time.today');
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return i18n.t('time.yesterday');
    }

    if (now - date < 7 * 24 * 60 * 60 * 1000) {
        const weekdays = [ i18n.t('time.weekdays.sunday'),
            i18n.t('time.weekdays.monday'),
            i18n.t('time.weekdays.tuesday'),
            i18n.t('time.weekdays.wednesday'),
            i18n.t('time.weekdays.thursday'),
            i18n.t('time.weekdays.friday'),
            i18n.t('time.weekdays.saturday')];
        return weekdays[date.getDay()];
    }

    return date.toLocaleDateString({
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const shouldShowTime = (currentMessage, previousMessage) => {
    if (!previousMessage) return true; // 第一条消息显示时间

    const currentTime = new Date(currentMessage.date);
    const previousTime = new Date(previousMessage.date);

    // 如果时间间隔超过1小时，显示时间
    return (currentTime - previousTime) > 5 * 60 * 60 * 1000;
};