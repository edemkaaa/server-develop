const kafka = require('./config');

const producer = kafka.producer();

const sendMessage = async (topic, message) => {
    try {
        await producer.connect();
        console.log('📤 Отправка сообщения в Kafka:', {
            topic,
            message
        });
        
        await producer.send({
            topic,
            messages: [
                { 
                    value: JSON.stringify(message),
                    timestamp: Date.now()
                }
            ],
        });
        
        console.log('✅ Сообщение успешно отправлено в Kafka\n');
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        throw error;
    }
};

const initProducer = async () => {
    try {
        await producer.connect();
        console.log('🚀 Producer успешно подключен к Kafka');
    } catch (error) {
        console.error('❌ Ошибка подключения producer:', error);
        throw error;
    }
};

module.exports = {
    sendMessage,
    initProducer
};
