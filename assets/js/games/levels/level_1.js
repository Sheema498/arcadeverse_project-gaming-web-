/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 1
 * Procedurally defined layout vectors coordinates.
 */

const Level_1_Data = {
    id: 1,
    bg: '#1a0833',
    grid: [
        "                                    C    #                               C  #             #E   #      C     ^  # C   #              ^                 ",
        "               C                                    # #     E      E   ##                  #    C      #     E                  #       ^#            ",
        "     # EE           #  #                  #                                            #        #      ###    E          E                            ",
        "         C                                                       #  #C       #                 #             #          E C              #            ",
        "              #    ^   C    #           ^              ^              ^       C                                            C                          ",
        "      #        C C        #                 E      ^            #               C   C   C   C          C        #        #         #     E            ",
        "           #                      #     # E               #  #     C   #      E    #  C                E C           C#    C   E                      ",
        "          #            ^                          C           #               C          C    C  ^                     C #      C       C             ",
        "      C        #        E #              #       #                      ##   #      #                C     E       E  #      C    #         E         ",
        "             #              C#  E      ^ C                             #             C #  C           #             E    #   C                        ",
        "      E                        E      #                                         C   ^           E            #                                        ",
        "                                 #                        C                                E     #                              #                     ",
        "             E     ##      E     C                               C             E  #           C   E                    C     C#      ^                ",
        "  S            #                ^  C     C                        ^         #  C        #                 #             C                   C Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_1_Data);
