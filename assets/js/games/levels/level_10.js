/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 10
 * Procedurally defined layout vectors coordinates.
 */

const Level_10_Data = {
    id: 10,
    bg: '#151518',
    grid: [
        "      E            E            # C               E      #                       C              #             #                      C #              ",
        "      # ^   #      ##     # C    C    E                              C                                 ##                                             ",
        "     C          #             C                C                        E      #    E   #         ^   #                                               ",
        "        #     C   ^E                        E         # #   CC         C     #                       C     C     C  #    C                            ",
        "                     # #C                                  #       #                          C           #      C                  #  C #  C         ",
        "             E                                   E        #C    #                  #                         C  #      #    C                         ",
        "                  E    E C                 #          ^         E                   E #           #               ^       C                           ",
        "           C E              C              ^##            #^     ## C   #        C   C                 C      #EE           #       C                 ",
        "                              ^         #           #  ^       #   E             E         #                                                          ",
        "                          #  E E#  ^                 E C            #   E             E   #        CE          E                    #C                ",
        "                 #                            C      C   #            C   C   C          E          ^          #^           # #                       ",
        "                    C                                C     C                 #                    #  #   #        ^             #                     ",
        "                           #       ##                  E                ##   E               ^   #           ^      ^           C    E                ",
        "  S                E           ^                  C   E         E                                  E         #    #E      C   # E    #        Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_10_Data);
