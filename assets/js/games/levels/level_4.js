/**
 * ArcadeVerse Level Data Configuration
 * Level ID: 4
 * Procedurally defined layout vectors coordinates.
 */

const Level_4_Data = {
    id: 4,
    bg: '#051810',
    grid: [
        "                E       ##             #            C   CEE^                        ^                   ##           #  ^   #                         ",
        "         #       #           #     E   #       #             ^                                   #C    #                # #E          #     C         ",
        "        #          #       #         C     E        #   #     C  C               #           C     #      ^       C   ^  C C    #   #      C          ",
        "              C    C       C                                                #                    #C #                    E E       C C                ",
        "         #     E          CC   #C               CE#                 ^     #       E         C  ^ E               E           C  C                     ",
        "            E                                 C            #           #                                              #                               ",
        "              #      ^     E                                    #               #           #       C  #                C  #                C         ",
        "            C     E     #                                  C                  #            # ##            #                              E           ",
        "           E                              E E        #          C         #       C #    #  C    #   ^   C               E           C      E         ",
        "       C    C     #           ^  E   E                                C ##     C                     #        C  E    C                  C            ",
        "     #                                      C #                              ^                #  C    ^  ^    # C                      #              ",
        "        # #                     #           C              #         #                 C                    #     #               ^    ^              ",
        "     C                            #    # #    #     #      #              ^     ^                                  #   E                              ",
        "  S    #          C     #   #^#  C                             E E    C                         C                    #E          CC       C   Exit    ",
        "######################################################################################################################################################",
    ]
};

// Push into global platform levels repository
if (!window.ArcadeLevels) window.ArcadeLevels = [];
window.ArcadeLevels.push(Level_4_Data);
