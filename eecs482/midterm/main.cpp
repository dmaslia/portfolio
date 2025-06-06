#include <iostream>
#include "cpu.h"
#include "thread.h"
#include "mutex.h"
#include "semaphore.h"

semaphore ping_s(1);

void player_ping(uintptr_t str) {
    int hits = 0;
    while(hits < 5) {
        ping_s.down();
        std::cout << reinterpret_cast<char *>(str) << std::endl;
        hits++;
        pong_s.up();
    }
}

void player_pong(uintptr_t str) {
    int hits = 0;
    while(hits < 5) {
        pong_s.down();
        std::cout << reinterpret_cast<char *>(str) << std::endl;
        hits++;
        ping_s.up();
    }


}



void runner(uintptr_t args_in) {
    thread ping = thread(player_ping, reinterpret_cast<uintptr_t>("ping"));
    thread pong = thread(player_pong, reinterpret_cast<uintptr_t>("pong"));

}

int main(int argc, char *argv[]) {
    cpu::boot(runner, 0, 0);

}
