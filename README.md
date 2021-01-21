// Para instalação do Sonic Search

1 - Baixar a imagem do search caso não tenha ainda;
2 - Criar pasta 'sonic', com arquivo 'sonic.cfg' dentro e suas configurações (prestar atenção na porta, no caso: 1491)
3 - Criar um container do Sonic no projeto em questão. Exemplo:

docker run -p 1491:1491 --name sonic_launchstore -v /Users/brunoweber/Development/Projects/launchstore/sonic/sonic.cfg:/etc/sonic.cfg -v /Users/brunoweber/Development/Projects/launchstore/sonic/store/:/var/lib/sonic/store -d valeriansaliou/sonic:v1.3.0
