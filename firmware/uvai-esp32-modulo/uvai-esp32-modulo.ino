/*
  UVAÍ — Firmware ÚNICO para todos os ESP32 da estufa
  ----------------------------------------------------
  Todas as placas usam ESTE MESMO arquivo. Para cada placa:
    1) Descomente UMA linha de PERFIL (mais abaixo)
    2) Confira os pinos desse perfil
    3) Troque WIFI_SSID / WIFI_PASSWORD se for outra rede

  Bibliotecas (Ferramentas > Gerenciar Bibliotecas):
    - ArduinoJson 6.x   - ESP32Servo
  Rede: Wi-Fi 2.4GHz

  Contrato com o site (o mesmo que o painel já usa):
    POST /api/leituras              { "umidade_solo": 52 }   <- só os campos desta placa
    GET  /api/comandos?alvos=bomba  { comandos:[{id, alvo, ligado}] } <- só os desta placa
    POST /api/comandos/confirmar    { id, alvo, ligado }
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ============ 1) REDE E SITE ============
const char* WIFI_SSID     = "IoT-IMD";
const char* WIFI_PASSWORD = "iot@imd#";
const char* BASE_URL      = "https://uvai-one.vercel.app";

// ============ 2) PERFIL: descomente SÓ UMA ============
//#define PERFIL_BOMBA
//#define PERFIL_VALVULA
//#define PERFIL_CLIMA
//#define PERFIL_LUZ
#define PERFIL_PORTA

// ============ ESTRUTURAS ============
// alvo = nome que o painel usa: bomba | valvula | ventilador | led
struct Rele   { const char* alvo; int pino; bool ativoAlto; };
// campo = nome da coluna na tabela "leituras"
struct Sensor { const char* campo; int pino; int brutoMin; int brutoMax; };

#define USA_SERVO 0
const int SERVO_PIN = 18;
#if defined(PERFIL_PORTA)
  // Porta: "ligado" = aberta. Ângulos do código original da porta.
  const char* SERVO_ALVO = "porta";
  const int ANGULO_LIGADO    = 95;
  const int ANGULO_DESLIGADO = 0;
#else
  // Válvula: CALIBRE no teste de bancada (mangueira livre = aberta, pinçada = fechada)
  const char* SERVO_ALVO = "valvula";
  const int ANGULO_LIGADO    = 0;
  const int ANGULO_DESLIGADO = 90;
#endif

// ============ PERFIS (ajuste os pinos aqui) ============
#if defined(PERFIL_BOMBA)
  // Bomba via MOSFET no GPIO26 (ativo em HIGH) + sensores de nível (ADC1)
  Rele   reles[]    = { {"bomba", 26, true} };
  Sensor sensores[] = { {"nivel_reservatorio", 34, 0, 4095},
                        {"nivel_caixa_elevada", 35, 0, 4095} };

#elif defined(PERFIL_VALVULA)
  // Válvula = servo SG90 pinçando a mangueira + sensor de umidade do solo
  #undef USA_SERVO
  #define USA_SERVO 1
  Rele   reles[1];
  // Umidade do solo: seco ~3200, molhado ~1400 (CALIBRE com o seu sensor)
  Sensor sensores[] = { {"umidade_solo", 32, 3200, 1400} };

#elif defined(PERFIL_PORTA)
  // Porta remota: servo no GPIO18 (alimente o servo com fonte externa de 5 V, GND em comum)
  #undef USA_SERVO
  #define USA_SERVO 1
  Rele   reles[1];
  Sensor sensores[1];

#elif defined(PERFIL_CLIMA)
  Rele   reles[]    = { {"ventilador", 25, true} };
  Sensor sensores[1];   // TODO: temperatura / umidade_ar (DHT22 ou DS18B20)

#elif defined(PERFIL_LUZ)
  Rele   reles[]    = { {"led", 33, true} };
  Sensor sensores[] = { {"luminosidade", 34, 0, 4095} };

#else
  #error "Descomente um PERFIL no topo do arquivo"
#endif

#if defined(PERFIL_PORTA)
  const int N_RELES = 0;
  const int N_SENSORES = 0;
#elif defined(PERFIL_VALVULA)
  const int N_RELES = 0;
  const int N_SENSORES = sizeof(sensores) / sizeof(sensores[0]);
#elif defined(PERFIL_CLIMA)
  const int N_RELES = sizeof(reles) / sizeof(reles[0]);
  const int N_SENSORES = 0;
#else
  const int N_RELES = sizeof(reles) / sizeof(reles[0]);
  const int N_SENSORES = sizeof(sensores) / sizeof(sensores[0]);
#endif

// ============ TEMPOS ============
const unsigned long LEITURAS_MS = 5000;
const unsigned long COMANDOS_MS = 2000;
unsigned long tLeituras = 0, tComandos = 0;

// ============ SERVO (não bloqueante) ============
#if USA_SERVO
Servo servo;
int servoAtual = ANGULO_DESLIGADO;
int servoAlvo  = ANGULO_DESLIGADO;
unsigned long tServo = 0;

void servoLoop() {
  if (servoAtual == servoAlvo) return;
  if (millis() - tServo < 10) return;
  tServo = millis();
  servoAtual += (servoAlvo > servoAtual) ? 1 : -1;
  servo.write(servoAtual);
}
#endif

// ============ HTTP ============
bool chamar(bool post, const String& url, const String& corpo, String& resposta) {
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClientSecure client;
  client.setInsecure();               // simplificação p/ projeto escolar
  HTTPClient http;
  http.setTimeout(6000);
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = post ? http.POST(corpo) : http.GET();
  if (code > 0) resposta = http.getString();
  http.end();
  Serial.printf("%s %s -> %d\n", post ? "POST" : "GET", url.c_str(), code);
  return code >= 200 && code < 300;
}

// ============ ATUADORES ============
bool aplicar(const String& alvo, bool ligar) {
  for (int i = 0; i < N_RELES; i++) {
    if (alvo == reles[i].alvo) {
      digitalWrite(reles[i].pino, (ligar == reles[i].ativoAlto) ? HIGH : LOW);
      return true;
    }
  }
#if USA_SERVO
  if (alvo == SERVO_ALVO) {
    servoAlvo = ligar ? ANGULO_LIGADO : ANGULO_DESLIGADO;
    return true;
  }
#endif
  return false;
}

// Lista de alvos desta placa, no formato "bomba,valvula" para o GET
String meusAlvos() {
  String s = "";
  for (int i = 0; i < N_RELES; i++) { if (s.length()) s += ","; s += reles[i].alvo; }
#if USA_SERVO
  if (s.length()) s += ",";
  s += SERVO_ALVO;
#endif
  return s;
}

// ============ SENSORES ============
int lerPercentual(const Sensor& s) {
  long bruto = 0;
  for (int i = 0; i < 8; i++) bruto += analogRead(s.pino);
  bruto /= 8;
  long pct = map(bruto, s.brutoMin, s.brutoMax, 0, 100);
  return constrain(pct, 0, 100);
}

// ============ COMUNICAÇÃO ============
void enviarLeituras() {
  if (N_SENSORES == 0) return;
  DynamicJsonDocument doc(512);
  for (int i = 0; i < N_SENSORES; i++) doc[sensores[i].campo] = lerPercentual(sensores[i]);
  String corpo, resp;
  serializeJson(doc, corpo);
  chamar(true, String(BASE_URL) + "/api/leituras", corpo, resp);
}

void confirmar(int id, const String& alvo, bool ligado) {
  DynamicJsonDocument doc(256);
  doc["id"] = id;
  doc["alvo"] = alvo;
  doc["ligado"] = ligado;
  String corpo, resp;
  serializeJson(doc, corpo);
  chamar(true, String(BASE_URL) + "/api/comandos/confirmar", corpo, resp);
}

void buscarComandos() {
  String alvos = meusAlvos();
  if (alvos.length() == 0) return;

  String resp;
  if (!chamar(false, String(BASE_URL) + "/api/comandos?alvos=" + alvos, "", resp)) return;

  DynamicJsonDocument doc(2048);
  if (deserializeJson(doc, resp)) return;

  for (JsonObject c : doc["comandos"].as<JsonArray>()) {
    int id = c["id"] | 0;
    String alvo = c["alvo"] | "";
    bool ligado = c["ligado"] | false;
    if (id > 0 && aplicar(alvo, ligado)) confirmar(id, alvo, ligado);
  }
}

// ============ SETUP / LOOP ============
void conectarWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.printf("\nOK! IP: %s | alvos: %s\n", WiFi.localIP().toString().c_str(), meusAlvos().c_str());
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < N_RELES; i++) {
    pinMode(reles[i].pino, OUTPUT);
    aplicar(reles[i].alvo, false);   // sempre começa desligado
  }
#if USA_SERVO
  servo.attach(SERVO_PIN);
  servo.write(ANGULO_DESLIGADO);
#endif
  conectarWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) conectarWifi();
#if USA_SERVO
  servoLoop();
#endif
  unsigned long agora = millis();
  if (agora - tComandos >= COMANDOS_MS) { tComandos = agora; buscarComandos(); }
  if (agora - tLeituras >= LEITURAS_MS) { tLeituras = agora; enviarLeituras(); }
}
